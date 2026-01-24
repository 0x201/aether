from abc import ABC, abstractmethod
import datetime
import random
import re

from enum import Enum
from typing import Any, Dict, List
from urllib.parse import urljoin

from loguru import logger
from playwright.async_api import async_playwright

from app.database import (
    EGameAudit,
    GameRevocationAudit,
    GameAlterationAudit,
    NetworkGameAudit,
    GameAudit,
)
from app.core.config import settings
from app.database import NPPARepository


class NPPAGameAuditType(Enum):
    FOREIGN_NETWOKR_GAME_AUDIT = "jkwlyxspxx"
    IMPORT_EGAME_AUDIT = "jkdzyxspxx"
    DOMESTIC_NETWORK_GAME_AUDIT = "gcwlyxspxx"
    GAME_ALTERATION_AUDIT = "yxspbgxx"
    GAME_REVOCATION_AUDIT = "yxspcxxx"


class GameAuditParsingStrategy(ABC):
    @abstractmethod
    async def parse(self, crawler: NPPAGameAuditCrawler, url: str) -> List[Any]:
        """
        Parse the given URL and return a list of audit data

        Parameters:
            crawler: The NPPA game audit crawler instance
            url: The URL to parse

        Returns:
            A list of parsed audit data objects
        """
        pass

    @abstractmethod
    def save_data(self, data: List, nppa_repo: NPPARepository) -> None:
        """
        Save the parsed data to repository

        Parameters:
            data: The parsed audit data
            nppa_repo: The repository dependency
        """
        pass

    @abstractmethod
    def get_strategy_name(self) -> str:
        """
        Get the name of this strategy

        Returns:
            The name of the strategy
        """
        pass


class DomesticNetworkGameParsingStrategy(GameAuditParsingStrategy):
    async def parse(
        self, crawler: NPPAGameAuditCrawler, url: str
    ) -> List[NetworkGameAudit]:
        return await crawler._parse_network_game_audits(
            url, NPPAGameAuditType.DOMESTIC_NETWORK_GAME_AUDIT.value
        )

    def save_data(self, data: List, nppa_repo: NPPARepository) -> None:
        nppa_repo.insert_many_network_game_audits(data)

    def get_strategy_name(self) -> str:
        return self.__class__.__name__


class ForeignNetworkGameParsingStrategy(GameAuditParsingStrategy):
    async def parse(
        self, crawler: NPPAGameAuditCrawler, url: str
    ) -> List[NetworkGameAudit]:
        return await crawler._parse_network_game_audits(
            url, NPPAGameAuditType.FOREIGN_NETWOKR_GAME_AUDIT.value
        )

    def save_data(self, data: List, nppa_repo: NPPARepository) -> None:
        nppa_repo.insert_many_network_game_audits(data)

    def get_strategy_name(self) -> str:
        return self.__class__.__name__


class GameAlterationParsingStrategy(GameAuditParsingStrategy):
    async def parse(
        self, crawler: NPPAGameAuditCrawler, url: str
    ) -> List[GameAlterationAudit]:
        return await crawler._parse_game_alteration_audits(url)

    def save_data(self, data: List, nppa_repo: NPPARepository) -> None:
        nppa_repo.insert_many_game_alteration_audits(data)

    def get_strategy_name(self) -> str:
        return self.__class__.__name__


class GameRevocationParsingStrategy(GameAuditParsingStrategy):
    async def parse(
        self, crawler: NPPAGameAuditCrawler, url: str
    ) -> List[GameRevocationAudit]:
        return await crawler._parse_game_revocation_audits(url)

    def save_data(self, data: List, nppa_repo: NPPARepository) -> None:
        nppa_repo.insert_many_game_revocation_audits(data)

    def get_strategy_name(self) -> str:
        return self.__class__.__name__


class EGameParsingStrategy(GameAuditParsingStrategy):
    async def parse(self, crawler: NPPAGameAuditCrawler, url: str) -> List[EGameAudit]:
        return await crawler._parse_egame_audits(url)

    def save_data(self, data: List, nppa_repo: NPPARepository) -> None:
        nppa_repo.insert_many_egame_audits(data)

    def get_strategy_name(self) -> str:
        return self.__class__.__name__


class GameAuditStrategyFactory:
    _strategies: Dict[str, GameAuditParsingStrategy] = {}

    @classmethod
    def register_strategy(
        cls, data_type: str, strategy: GameAuditParsingStrategy
    ) -> None:
        """
        Register a new strategy

        Parameters:
            data_type: The data type key
            strategy: The strategy instance to register
        """
        cls._strategies[data_type] = strategy

    @classmethod
    def get_strategy(cls, data_type: str) -> GameAuditParsingStrategy:
        """
        Get a strategy for the given data type

        Parameters:
            data_type: The data type key

        Returns:
            The registered strategy for the given type

        Raises:
            ValueError: If no strategy is found for the given data type
        """
        strategy = cls._strategies.get(data_type)
        if not strategy:
            raise ValueError(f"No strategy found for data type: {data_type}")
        return strategy

    @classmethod
    def get_all_types(cls) -> List[str]:
        """
        Get all registered data types

        Returns:
            A list of all registered data types
        """
        return list(cls._strategies.keys())

    @classmethod
    def initialize_default_strategies(cls) -> None:
        """
        Initialize the factory with default strategies
        This should be called once during application startup
        """
        if not cls._strategies:  # Only initialize once
            cls.register_strategy(
                NPPAGameAuditType.DOMESTIC_NETWORK_GAME_AUDIT.value,
                DomesticNetworkGameParsingStrategy(),
            )
            cls.register_strategy(
                NPPAGameAuditType.FOREIGN_NETWOKR_GAME_AUDIT.value,
                ForeignNetworkGameParsingStrategy(),
            )
            cls.register_strategy(
                NPPAGameAuditType.GAME_ALTERATION_AUDIT.value,
                GameAlterationParsingStrategy(),
            )
            cls.register_strategy(
                NPPAGameAuditType.GAME_REVOCATION_AUDIT.value,
                GameRevocationParsingStrategy(),
            )
            cls.register_strategy(
                NPPAGameAuditType.IMPORT_EGAME_AUDIT.value, EGameParsingStrategy()
            )


class NPPAGameAuditCrawler:
    """
    National Press and Publication Administration (NPPA) Game Audit Crawler
    """

    def __init__(self, nppa_repository: NPPARepository):
        self.base_url = settings.nppa.base_url
        self.data_url = settings.nppa.data_url
        self.suffix = settings.nppa.suffix
        self.playwright = None
        self.browser = None
        self.random_number = random.randint(1, 1000_000)
        self.nppa_repository = nppa_repository

    async def run(self, mode: int = 0) -> None:
        """
        Entry of the crawler

        Parameters:
            mode: 0 incremental data 1 full data, default 0
        """
        GameAuditStrategyFactory.initialize_default_strategies()
        try:
            if mode == 0:
                await self._get_latest_game_audits()
            else:
                await self._get_all_game_audits()
        finally:
            await self._close_browser()

    async def _initialize_browser(self):
        """Initialize the browser instance"""
        if self.browser is None:
            self.playwright = await async_playwright().start()
            if self.random_number % 2 == 0:
                self.browser = await self.playwright.chromium.launch()
            else:
                self.browser = await self.playwright.firefox.launch()

    async def _close_browser(self):
        """Close the browser instance"""
        if self.browser:
            await self.browser.close()
            self.browser = None
        if self.playwright:
            await self.playwright.stop()
            self.playwright = None

    async def _parse_table(self, url: str) -> List[GameAudit]:
        """Parse data table
        :return: List of game audits
        """
        await self._initialize_browser()

        if self.browser is None:
            logger.error("Failed to initialize browser.")
            return []

        page = await self.browser.new_page()
        logger.info(f"Start to parse {url}.")

        try:
            await page.goto(url=url)

            # Wait for the content to load
            await page.wait_for_selector("ul.m2nrul")

            # Get all li elements
            li_elements = await page.query_selector_all("ul.m2nrul li")
            links = []

            for li in li_elements:
                a = await li.query_selector("a")
                if a is None:
                    continue

                title = await a.text_content()
                if title is None:
                    continue

                href = await a.get_attribute("href")
                if href is None:
                    continue

                # Fix URL construction to handle both relative and absolute URLs
                url_path = urljoin(self.base_url, href)
                span = await li.query_selector("span")
                if span is None:
                    continue

                span_text = await span.text_content()
                if span_text is None:
                    continue

                publish_date_str = re.sub(r"[\[\]]", "", span_text)
                try:
                    publish_date = datetime.datetime.strptime(
                        publish_date_str, "%Y-%m-%d"
                    )
                    links.append(
                        GameAudit(
                            title=title.strip().replace("\n", "").replace("\r", ""),
                            url=url_path,
                            publish_date=publish_date,
                        )
                    )
                except ValueError:
                    logger.warning(f"Could not parse date: {publish_date_str}")
                    continue

        finally:
            await page.close()

        links.reverse()
        logger.info("Parse completed.")
        return links

    async def _parse_network_game_audits(
        self, url: str, game_type: str
    ) -> List[NetworkGameAudit]:
        """Parse network game audits
        :param url: url of network game
        :param game_type: gcwlyxspxx -> domestic jkwlyxspxx -> foreign
        :return: List of network game audits
        """
        await self._initialize_browser()

        if self.browser is None:
            logger.error("Failed to initialize browser.")
            return []

        page = await self.browser.new_page()
        logger.info(f"Start to parse network game audit, url: {url}.")
        network_games = []

        try:
            await page.goto(url=url)

            # Wait for content to load
            await page.wait_for_selector("tr")

            table_row_selector = "tr:not([style*=color])"
            table_rows = []

            if game_type == NPPAGameAuditType.DOMESTIC_NETWORK_GAME_AUDIT.value:
                # For domestic games, find the specific table
                tables = await page.query_selector_all("table.trStyle.tableOrder")
                if tables:
                    table_rows = await tables[0].query_selector_all(table_row_selector)
            else:
                # For foreign games
                table_rows = await page.query_selector_all(table_row_selector)

            for row in table_rows:
                tds = await row.query_selector_all("td")
                if len(tds) < 7:  # Skip rows without enough columns
                    continue

                # Extract text content with safety checks
                name_elem = await tds[1].text_content() if len(tds) > 1 else ""
                name = (
                    name_elem.strip().replace("\n", "").replace("\r", "")
                    if name_elem
                    else ""
                )

                td_count = len(tds)

                audit_category_elem = (
                    ""
                    if td_count == 7
                    else (await tds[2].text_content() if len(tds) > 2 else "")
                )
                audit_category = (
                    audit_category_elem.strip().replace("\n", "").replace("\r", "")
                    if audit_category_elem
                    else ""
                )

                if td_count == 7:
                    publisher_elem = await tds[2].text_content() if len(tds) > 2 else ""
                    operator_elem = await tds[3].text_content() if len(tds) > 3 else ""
                    audit_no_elem = await tds[4].text_content() if len(tds) > 4 else ""
                    isbn_elem = await tds[5].text_content() if len(tds) > 5 else ""
                    publish_date_elem = (
                        await tds[6].text_content() if len(tds) > 6 else ""
                    )
                else:
                    publisher_elem = await tds[3].text_content() if len(tds) > 3 else ""
                    operator_elem = await tds[4].text_content() if len(tds) > 4 else ""
                    audit_no_elem = await tds[5].text_content() if len(tds) > 5 else ""
                    isbn_elem = await tds[6].text_content() if len(tds) > 6 else ""
                    publish_date_elem = (
                        await tds[7].text_content() if len(tds) > 7 else ""
                    )

                publisher = (
                    publisher_elem.strip().replace("\n", "").replace("\r", "")
                    if publisher_elem
                    else ""
                )
                operator = (
                    operator_elem.strip().replace("\n", "").replace("\r", "")
                    if operator_elem
                    else ""
                )
                audit_no = (
                    audit_no_elem.strip().replace("\n", "").replace("\r", "")
                    if audit_no_elem
                    else ""
                )
                isbn = (
                    isbn_elem.strip().replace("\n", "").replace("\r", "")
                    if isbn_elem
                    else ""
                )
                publish_date_str = (
                    publish_date_elem.strip().replace("\n", "").replace("\r", "")
                    if publish_date_elem
                    else ""
                )

                if not name or not publish_date_str:
                    continue

                category = 1 if game_type == "gcwlyxspxx" else 2

                try:
                    publish_date = datetime.datetime.strptime(
                        publish_date_str, "%Y年%m月%d日"
                    )
                    network_games.append(
                        NetworkGameAudit(
                            name=name,
                            audit_category=audit_category,
                            publisher=publisher,
                            operator=operator,
                            audit_no=audit_no,
                            isbn=isbn,
                            category=category,
                            publish_date=publish_date,
                        )
                    )
                except ValueError:
                    logger.warning(f"Could not parse date: {publish_date_str}")
                    continue

        finally:
            await page.close()

        logger.info(
            f"Parsed total {len(network_games)} network game audits from url: {url}."
        )
        return network_games

    async def _parse_egame_audits(self, url: str) -> List[EGameAudit]:
        """Parse foreign e-game audits
        :param url: url of e-game audits(319)
        :return: List of foreign e-game audits
        """
        await self._initialize_browser()

        if self.browser is None:
            logger.error("Failed to initialize browser.")
            return []

        page = await self.browser.new_page()
        logger.info(f"Start to parse e-game audit, url: {url}.")
        egames = []  # Move initialization before try block

        try:
            await page.goto(url=url)

            # Wait for content to load
            await page.wait_for_selector("tr:not([style*=color])")

            table_rows = await page.query_selector_all("tr:not([style*=color])")
            for row in table_rows:
                tds = await row.query_selector_all("td")
                if len(tds) < 5:  # Skip rows without enough columns
                    continue

                # Extract text content with safety checks
                name_elem = await tds[1].text_content() if len(tds) > 1 else ""
                publisher_elem = await tds[2].text_content() if len(tds) > 2 else ""
                audit_no_elem = await tds[3].text_content() if len(tds) > 3 else ""
                publish_date_elem = await tds[4].text_content() if len(tds) > 4 else ""

                name = (
                    name_elem.strip().replace("\n", "").replace("\r", "")
                    if name_elem
                    else ""
                )
                publisher = (
                    publisher_elem.strip().replace("\n", "").replace("\r", "")
                    if publisher_elem
                    else ""
                )
                audit_no = (
                    audit_no_elem.strip().replace("\n", "").replace("\r", "")
                    if audit_no_elem
                    else ""
                )
                publish_date_str = (
                    publish_date_elem.strip().replace("\n", "").replace("\r", "")
                    if publish_date_elem
                    else ""
                )

                if not name or not publish_date_str:
                    continue

                try:
                    publish_date = datetime.datetime.strptime(
                        publish_date_str, "%Y年%m月%d日"
                    )
                    egames.append(
                        EGameAudit(
                            name=name,
                            publisher=publisher,
                            audit_no=audit_no,
                            publish_date=publish_date,
                        )
                    )
                except ValueError:
                    logger.warning(f"Could not parse date: {publish_date_str}")
                    continue

        finally:
            await page.close()

        logger.info(f"Parsed total {len(egames)} e-game audits from url: {url}.")
        return egames

    async def _parse_game_revocation_audits(
        self, url: str
    ) -> List[GameRevocationAudit]:
        """Parse game revocation audits
        :param url: url of revocation
        :return: List of game revocation audits
        """
        await self._initialize_browser()

        if self.browser is None:
            logger.error("Failed to initialize browser.")
            return []

        page = await self.browser.new_page()
        logger.info(f"Start to parse game audit revocations, url: {url}.")
        revocations = []  # Move initialization before try block

        try:
            await page.goto(url=url)

            # Wait for content to load
            await page.wait_for_selector("tr:not([style*=color])")

            table_rows = await page.query_selector_all("tr:not([style*=color])")
            for row in table_rows:
                tds = await row.query_selector_all("td")
                if len(tds) < 9:  # Skip rows without enough columns
                    continue

                # Extract text content with safety checks
                name_elem = await tds[1].text_content() if len(tds) > 1 else ""
                audit_category_elem = (
                    await tds[2].text_content() if len(tds) > 2 else ""
                )
                publisher_elem = await tds[3].text_content() if len(tds) > 3 else ""
                operator_elem = await tds[4].text_content() if len(tds) > 4 else ""
                revocation_msg_elem = (
                    await tds[5].text_content() if len(tds) > 5 else ""
                )
                audit_no_elem = await tds[6].text_content() if len(tds) > 6 else ""
                isbn_elem = await tds[7].text_content() if len(tds) > 7 else ""
                approval_date_elem = await tds[8].text_content() if len(tds) > 8 else ""

                name = (
                    name_elem.strip().replace("\n", "").replace("\r", "")
                    if name_elem
                    else ""
                )
                audit_category = (
                    audit_category_elem.strip().replace("\n", "").replace("\r", "")
                    if audit_category_elem
                    else ""
                )
                publisher = (
                    publisher_elem.strip().replace("\n", "").replace("\r", "")
                    if publisher_elem
                    else ""
                )
                operator = (
                    operator_elem.strip().replace("\n", "").replace("\r", "")
                    if operator_elem
                    else ""
                )
                revocation_msg = (
                    revocation_msg_elem.strip().replace("\n", "").replace("\r", "")
                    if revocation_msg_elem
                    else ""
                )
                audit_no = (
                    audit_no_elem.strip().replace("\n", "").replace("\r", "")
                    if audit_no_elem
                    else ""
                )
                isbn = (
                    isbn_elem.strip().replace("\n", "").replace("\r", "")
                    if isbn_elem
                    else ""
                )
                approval_date_str = (
                    approval_date_elem.strip().replace("\n", "").replace("\r", "")
                    if approval_date_elem
                    else ""
                )

                if not name or not approval_date_str:
                    continue

                try:
                    approval_date = datetime.datetime.strptime(
                        approval_date_str, "%Y年%m月%d日"
                    )
                    revocations.append(
                        GameRevocationAudit(
                            name=name,
                            audit_category=audit_category,
                            publisher=publisher,
                            operator=operator,
                            revocation_msg=revocation_msg,
                            audit_no=audit_no,
                            isbn=isbn,
                            approval_date=approval_date,
                        )
                    )
                except ValueError:
                    logger.warning(f"Could not parse date: {approval_date_str}")
                    continue

        finally:
            await page.close()

        logger.info(
            f"Parsed total {len(revocations)} game revocation audits from url: {url}."
        )
        return revocations

    async def _parse_game_alteration_audits(
        self, url: str
    ) -> List[GameAlterationAudit]:
        """Parse game audit changes
        :param url: url of changes
        :return: List of game audit changes
        """
        await self._initialize_browser()

        if self.browser is None:
            logger.error("Failed to initialize browser.")
            return []

        page = await self.browser.new_page()
        logger.info(f"Start to parse game change audit, url: {url}.")
        alterations = []  # Move initialization before try block

        try:
            await page.goto(url=url)

            # Wait for content to load
            await page.wait_for_selector("tr:not([style*=color])")

            table_rows = await page.query_selector_all("tr:not([style*=color])")
            for row in table_rows:
                tds = await row.query_selector_all("td")
                if len(tds) < 8:  # Skip rows without enough columns
                    continue

                # Extract text content with safety checks
                name_elem = await tds[1].text_content() if len(tds) > 1 else ""
                audit_category_elem = (
                    await tds[2].text_content() if len(tds) > 2 else ""
                )
                publisher_elem = await tds[3].text_content() if len(tds) > 3 else ""
                operator_elem = await tds[4].text_content() if len(tds) > 4 else ""
                alteration_msg_elem = (
                    await tds[5].text_content() if len(tds) > 5 else ""
                )
                audit_no_elem = await tds[6].text_content() if len(tds) > 6 else ""
                alter_date_elem = await tds[7].text_content() if len(tds) > 7 else ""

                name = (
                    name_elem.strip().replace("\n", "").replace("\r", "")
                    if name_elem
                    else ""
                )
                audit_category = (
                    audit_category_elem.strip().replace("\n", "").replace("\r", "")
                    if audit_category_elem
                    else ""
                )
                publisher = (
                    publisher_elem.strip().replace("\n", "").replace("\r", "")
                    if publisher_elem
                    else ""
                )
                operator = (
                    operator_elem.strip().replace("\n", "").replace("\r", "")
                    if operator_elem
                    else ""
                )
                alteration_msg = (
                    alteration_msg_elem.strip().replace("\n", "").replace("\r", "")
                    if alteration_msg_elem
                    else ""
                )
                audit_no = (
                    audit_no_elem.strip().replace("\n", "").replace("\r", "")
                    if audit_no_elem
                    else ""
                )
                alter_date_str = (
                    alter_date_elem.strip().replace("\n", "").replace("\r", "")
                    if alter_date_elem
                    else ""
                )

                if not name or not alter_date_str:
                    continue

                try:
                    alter_date = datetime.datetime.strptime(
                        alter_date_str, "%Y年%m月%d日"
                    )
                    alterations.append(
                        GameAlterationAudit(
                            name=name,
                            audit_category=audit_category,
                            publisher=publisher,
                            operator=operator,
                            alteration_msg=alteration_msg,
                            audit_no=audit_no,
                            alter_date=alter_date,
                        )
                    )
                except ValueError:
                    logger.warning(f"Could not parse date: {alter_date_str}")
                    continue

        finally:
            await page.close()

        logger.info(
            f"Parsed total {len(alterations)} game change audits from url: {url}."
        )
        return alterations

    async def _get_latest_game_audits(self) -> None:
        """Get incremental game audits and save to database"""
        game_audits = await self._parse_table(
            self.base_url + self.data_url + self.suffix
        )
        latest_game_audit = self.nppa_repository.get_latest_game_audit()
        if game_audits and len(game_audits) > 0 and latest_game_audit is not None:
            # check the last game audit in links whether is newer than latest_game_audit
            if game_audits[-1].publish_date <= latest_game_audit.publish_date:
                return

            # get game audits newer than latest_game_audit
            new_audits = [
                audit
                for audit in game_audits
                if audit.publish_date > latest_game_audit.publish_date
            ]

            self.nppa_repository.insert_many_game_audits(new_audits)
            logger.info(f"Saved total {len(game_audits)} game audits to CSV")
            await self._parse_game_audits(game_audits)
        else:
            logger.info("No new NPPA game audit to save.")

    async def _get_all_game_audits(self) -> None:
        """Get full game audits and save to database"""
        await self._initialize_browser()

        if self.browser is None:
            logger.error("Failed to initialize browser.")
            return

        page = await self.browser.new_page()

        try:
            await page.goto(url=self.base_url + self.data_url + self.suffix)

            # Wait for content to load
            await page.wait_for_selector("a.sPage_a.sPage_prev")

            prev_link = await page.query_selector("a.sPage_a.sPage_prev")
            if prev_link is None:
                logger.error("Could not find pagination element")
                return

            total_page_text = await prev_link.text_content()
            if total_page_text is None:
                logger.error("Could not get pagination text")
                return

            total_page = re.sub(r"\D", "", total_page_text)

        finally:
            await page.close()

        game_audit_list = []
        for i in range(int(total_page) - 1, -1, -1):
            current_page = "" if i == 0 else f"_{i}"
            url = f"{self.base_url}{self.data_url}{current_page}{self.suffix}"
            parsed_data = await self._parse_table(url)
            game_audit_list.extend(parsed_data)
        if game_audit_list:
            self.nppa_repository.insert_many_game_audits(game_audit_list)
            logger.info(f"Saved total {len(game_audit_list)} game audits to CSV")
            await self._parse_game_audits(game_audit_list)
        else:
            logger.info("No NPPA game audit to save.")

    async def _parse_game_audits(self, game_audits: List[GameAudit]) -> None:
        """
        Parse game audits and save to CSV

        Parameters:
            param game_audits: List of game audits
        """
        # Group audits by type to reduce file operations
        audits_by_type = {}

        for audit in game_audits:
            match = re.search(r"/(\w{8,10})/", audit.url)
            if match is None:
                continue
            data_type = match.group(1)

            if data_type not in audits_by_type:
                audits_by_type[data_type] = []
            audits_by_type[data_type].append(audit)

        # Process each type with its strategy
        for data_type, audits in audits_by_type.items():
            try:
                strategy = GameAuditStrategyFactory.get_strategy(data_type)
                all_parsed_data = []

                for audit in audits:
                    parsed_data = await strategy.parse(self, audit.url)
                    all_parsed_data.extend(parsed_data)

                if all_parsed_data:
                    strategy.save_data(all_parsed_data, self.nppa_repository)
                    logger.info(
                        f"Saved total {len(all_parsed_data)} records to database."
                    )

            except ValueError as e:
                logger.warning(str(e))
