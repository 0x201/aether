import datetime
import getopt
import logging
import random
import sys
from typing import List, Optional

from playwright.sync_api import sync_playwright
import re

from sqlalchemy.orm import Session

from api import deps
from models import EGameAudit, GameRevocationAudit, GameAlterationAudit
from models.network_game_audit import NetworkGameAudit
from models.game_audit import GameAudit
from src.crud import (
    egame_audit,
    game_audit,
    game_alteration_audit,
    game_revocation_audit,
    network_game_audit,
)
from config import config


class NPPAGameAuditCrawler:
    """
    National Press and Publication Administration (NPPA) Game Audit Crawler
    """

    def __init__(self):
        app_config = config.app_config
        self.base_url = app_config.nppa_config.base_url
        self.data_url = app_config.nppa_config.data_url
        self.suffix = app_config.nppa_config.suffix

    def _parse_table(self, url: str) -> List[GameAudit]:
        """Parse data table
        :return: List of game audits
        """
        logging.info(f"Start to parse {url}.")
        with sync_playwright() as p:
            random_number = random.randint(1, 1000_000)
            if random_number % 2 == 0:
                browser = p.chromium.launch()
            else:
                browser = p.firefox.launch()
            page = browser.new_page()
            page.goto(url=url)

            # Wait for the content to load
            page.wait_for_selector("ul.m2nrul")

            # Get all li elements
            li_elements = page.query_selector_all("ul.m2nrul li")
            links = []

            for li in li_elements:
                a = li.query_selector("a")
                if a is None:
                    continue
                    
                title = a.text_content()
                if title is None:
                    continue
                    
                href = a.get_attribute("href")
                if href is None:
                    continue
                    
                url_path = f"{self.base_url}{href[1:]}" if href.startswith("/") else href
                span = li.query_selector("span")
                if span is None:
                    continue
                    
                span_text = span.text_content()
                if span_text is None:
                    continue
                    
                publish_date_str = re.sub(r"[\[\]]", "", span_text)
                try:
                    publish_date = datetime.datetime.strptime(
                        publish_date_str, "%Y-%m-%d"
                    )
                    links.append(
                        GameAudit(
                            title=title.strip(),
                            url=url_path,
                            publish_date=publish_date,
                        )
                    )
                except ValueError:
                    logging.warning(f"Could not parse date: {publish_date_str}")
                    continue
                    
            browser.close()

        logging.info("Parse completed.")
        return links

    def _parse_network_game_audits(
        self, url: str, game_type: str
    ) -> List[NetworkGameAudit]:
        """Parse network game audits
        :param url: url of network game
        :param game_type: gcwlyxspxx -> domestic jkwlyxspxx -> foreign
        :return: List of network game audits
        """
        logging.info(f"Start to parse network game audit, url: {url}.")
        network_games = []
        with sync_playwright() as p:
            random_number = random.randint(1, 1000_000)
            if random_number % 2 == 0:
                browser = p.chromium.launch()
            else:
                browser = p.firefox.launch()
            page = browser.new_page()
            page.goto(url=url)

            # Wait for content to load
            page.wait_for_selector("tr")

            table_row_selector = "tr:not([style*=color])"
            table_rows = []

            if game_type == "gcwlyxspxx":
                # For domestic games, find the specific table
                tables = page.query_selector_all("table.trStyle.tableOrder")
                if tables:
                    table_rows = tables[0].query_selector_all(table_row_selector)
            else:
                # For foreign games
                table_rows = page.query_selector_all(table_row_selector)

            for row in table_rows:
                tds = row.query_selector_all("td")
                if len(tds) < 7:  # Skip rows without enough columns
                    continue

                # Extract text content with safety checks
                name_elem = tds[1].text_content() if len(tds) > 1 else ""
                name = name_elem.strip() if name_elem else ""
                
                td_count = len(tds)
                
                audit_category_elem = "" if td_count == 7 else (tds[2].text_content() if len(tds) > 2 else "")
                audit_category = audit_category_elem.strip() if audit_category_elem else ""
                
                if td_count == 7:
                    publisher_elem = tds[2].text_content() if len(tds) > 2 else ""
                    operator_elem = tds[3].text_content() if len(tds) > 3 else ""
                    audit_no_elem = tds[4].text_content() if len(tds) > 4 else ""
                    isbn_elem = tds[5].text_content() if len(tds) > 5 else ""
                    publish_date_elem = tds[6].text_content() if len(tds) > 6 else ""
                else:
                    publisher_elem = tds[3].text_content() if len(tds) > 3 else ""
                    operator_elem = tds[4].text_content() if len(tds) > 4 else ""
                    audit_no_elem = tds[5].text_content() if len(tds) > 5 else ""
                    isbn_elem = tds[6].text_content() if len(tds) > 6 else ""
                    publish_date_elem = tds[7].text_content() if len(tds) > 7 else ""
                
                publisher = publisher_elem.strip() if publisher_elem else ""
                operator = operator_elem.strip() if operator_elem else ""
                audit_no = audit_no_elem.strip() if audit_no_elem else ""
                isbn = isbn_elem.strip() if isbn_elem else ""
                publish_date_str = publish_date_elem.strip() if publish_date_elem else ""
                
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
                    logging.warning(f"Could not parse date: {publish_date_str}")
                    continue
                    
            browser.close()

        logging.info(
            f"Parsed total {len(network_games)} network game audits from url: {url}."
        )
        return network_games

    def _parse_egame_audits(self, url: str) -> List[EGameAudit]:
        """Parse foreign e-game audits
        :param url: url of e-game audits(319)
        :return: List of foreign e-game audits
        """
        logging.info(f"Start to parse e-game audit, url: {url}.")
        egames = []
        with sync_playwright() as p:
            random_number = random.randint(1, 1000_000)
            if random_number % 2 == 0:
                browser = p.chromium.launch()
            else:
                browser = p.firefox.launch()
            page = browser.new_page()
            page.goto(url=url)

            # Wait for content to load
            page.wait_for_selector("tr:not([style*=color])")

            table_rows = page.query_selector_all("tr:not([style*=color])")
            for row in table_rows:
                tds = row.query_selector_all("td")
                if len(tds) < 5:  # Skip rows without enough columns
                    continue

                # Extract text content with safety checks
                name_elem = tds[1].text_content() if len(tds) > 1 else ""
                publisher_elem = tds[2].text_content() if len(tds) > 2 else ""
                audit_no_elem = tds[3].text_content() if len(tds) > 3 else ""
                publish_date_elem = tds[4].text_content() if len(tds) > 4 else ""
                
                name = name_elem.strip() if name_elem else ""
                publisher = publisher_elem.strip() if publisher_elem else ""
                audit_no = audit_no_elem.strip() if audit_no_elem else ""
                publish_date_str = publish_date_elem.strip() if publish_date_elem else ""
                
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
                    logging.warning(f"Could not parse date: {publish_date_str}")
                    continue
                    
            browser.close()

        logging.info(f"Parsed total {len(egames)} e-game audits from url: {url}.")
        return egames

    def _parse_game_revocation_audits(self, url: str) -> List[GameRevocationAudit]:
        """Parse game revocation audits
        :param url: url of revocation
        :return: List of game revocation audits
        """
        logging.info(f"Start to parse game audit revocations, url: {url}.")
        revocations = []
        with sync_playwright() as p:
            random_number = random.randint(1, 1000_000)
            if random_number % 2 == 0:
                browser = p.chromium.launch()
            else:
                browser = p.firefox.launch()
            page = browser.new_page()
            page.goto(url=url)

            # Wait for content to load
            page.wait_for_selector("tr:not([style*=color])")

            table_rows = page.query_selector_all("tr:not([style*=color])")
            for row in table_rows:
                tds = row.query_selector_all("td")
                if len(tds) < 9:  # Skip rows without enough columns
                    continue

                # Extract text content with safety checks
                name_elem = tds[1].text_content() if len(tds) > 1 else ""
                audit_category_elem = tds[2].text_content() if len(tds) > 2 else ""
                publisher_elem = tds[3].text_content() if len(tds) > 3 else ""
                operator_elem = tds[4].text_content() if len(tds) > 4 else ""
                revocation_msg_elem = tds[5].text_content() if len(tds) > 5 else ""
                audit_no_elem = tds[6].text_content() if len(tds) > 6 else ""
                isbn_elem = tds[7].text_content() if len(tds) > 7 else ""
                approval_date_elem = tds[8].text_content() if len(tds) > 8 else ""
                
                name = name_elem if name_elem else ""
                audit_category = audit_category_elem.strip() if audit_category_elem else ""
                publisher = publisher_elem.strip() if publisher_elem else ""
                operator = operator_elem.strip() if operator_elem else ""
                revocation_msg = revocation_msg_elem.strip() if revocation_msg_elem else ""
                audit_no = audit_no_elem.strip() if audit_no_elem else ""
                isbn = isbn_elem.strip() if isbn_elem else ""
                approval_date_str = approval_date_elem.strip() if approval_date_elem else ""
                
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
                    logging.warning(f"Could not parse date: {approval_date_str}")
                    continue
                    
            browser.close()

        logging.info(
            f"Parsed total {len(revocations)} game revocation audits from url: {url}."
        )
        return revocations

    def _parse_game_alteration_audits(self, url: str) -> List[GameAlterationAudit]:
        """Parse game audit changes
        :param url: url of changes
        :return: List of game audit changes
        """
        logging.info(f"Start to parse game change audit, url: {url}.")
        alterations = []
        with sync_playwright() as p:
            random_number = random.randint(1, 1000_000)
            if random_number % 2 == 0:
                browser = p.chromium.launch()
            else:
                browser = p.firefox.launch()
            page = browser.new_page()
            page.goto(url=url)

            # Wait for content to load
            page.wait_for_selector("tr:not([style*=color])")

            table_rows = page.query_selector_all("tr:not([style*=color])")
            for row in table_rows:
                tds = row.query_selector_all("td")
                if len(tds) < 8:  # Skip rows without enough columns
                    continue

                # Extract text content with safety checks
                name_elem = tds[1].text_content() if len(tds) > 1 else ""
                audit_category_elem = tds[2].text_content() if len(tds) > 2 else ""
                publisher_elem = tds[3].text_content() if len(tds) > 3 else ""
                operator_elem = tds[4].text_content() if len(tds) > 4 else ""
                alteration_msg_elem = tds[5].text_content() if len(tds) > 5 else ""
                audit_no_elem = tds[6].text_content() if len(tds) > 6 else ""
                alter_date_elem = tds[7].text_content() if len(tds) > 7 else ""
                
                name = name_elem.strip() if name_elem else ""
                audit_category = audit_category_elem.strip() if audit_category_elem else ""
                publisher = publisher_elem.strip() if publisher_elem else ""
                operator = operator_elem.strip() if operator_elem else ""
                alteration_msg = alteration_msg_elem.strip() if alteration_msg_elem else ""
                audit_no = audit_no_elem.strip() if audit_no_elem else ""
                alter_date_str = alter_date_elem.strip() if alter_date_elem else ""
                
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
                    logging.warning(f"Could not parse date: {alter_date_str}")
                    continue
                    
            browser.close()

        logging.info(
            f"Parsed total {len(alterations)} game change audits from url: {url}."
        )
        return alterations

    def _get_latest_game_audits(self, db: Session) -> None:
        """Get incremental game audits
        :param db: Database session
        """
        links = self._parse_table(self.base_url + self.data_url + self.suffix)
        latest_date = game_audit.get_latest_date(db)
        links = list(filter(lambda x: x.publish_date > latest_date, links))
        save_count = 0
        updated_links = []
        # save links
        if links:
            for link in links:
                existing_game_audit = game_audit.get(db, link.title)
                if existing_game_audit:
                    # Update existing record - for now just log it
                    logging.info(f"Game audit {link.title} already exists")
                else:
                    updated_link = game_audit.create(db, obj_in=link)
                    save_count += 1
                    updated_links.append(updated_link)
            logging.info(f"Saved total {save_count} game audits")
            self._parse_game_audits(db, links)
        else:
            logging.info("There's no new NPPA game audit to save.")

    def _get_all_game_audits(self, db: Session) -> None:
        """Get full game audits. Will clean up tables and refill data
        :param db: Database session
        """
        is_empty = game_audit.is_empty(db)
        if not is_empty:
            game_audit.delete_all(db)  # clear database table

        with sync_playwright() as p:
            random_number = random.randint(1, 1000_000)
            if random_number % 2 == 0:
                browser = p.chromium.launch()
            else:
                browser = p.firefox.launch()
            page = browser.new_page()
            page.goto(url=self.base_url + self.data_url + self.suffix)

            # Wait for content to load
            page.wait_for_selector("a.sPage_a.sPage_prev")

            prev_link = page.query_selector("a.sPage_a.sPage_prev")
            if prev_link is None:
                browser.close()
                logging.error("Could not find pagination element")
                return
                
            total_page_text = prev_link.text_content()
            if total_page_text is None:
                browser.close()
                logging.error("Could not get pagination text")
                return
                
            total_page = re.sub(r"\D", "", total_page_text)
            browser.close()

        game_audit_list = []
        for i in range(int(total_page) - 1, -1, -1):
            current_page = "" if i == 0 else f"_{i}"
            url = f"{self.base_url}{self.data_url}{current_page}{self.suffix}"
            game_audit_list.extend(self._parse_table(url))
        if game_audit_list:
            game_audit.multiple_create(db, objs_in=game_audit_list)
            logging.info(f"Saved total {len(game_audit_list)} game audits")
            self._parse_game_audits(db, game_audit_list)
        else:
            logging.info("No NPPA game audit to save.")

    def _parse_game_audits(self, db: Session, game_audits: list[GameAudit]) -> None:
        """Parse game audits
        :param db: Database session
        :param game_audits： List of game audits
        """
        domestic_network_game_cnt = foreign_network_game_cnt = audit_changes_cnt = (
            audit_cancel_cnt
        ) = egame_audit_cnt = 0
        for audits in game_audits:
            match = re.search(r"/(\w{8,10})/", audits.url)
            if match is None:
                continue
            data_type = match.group(1)
            
            if data_type == "gcwlyxspxx":
                domestic_network_games = self._parse_network_game_audits(
                    audits.url, data_type
                )
                domestic_network_game_cnt += len(domestic_network_games)
                network_game_audit.multiple_create(
                    db, objs_in=domestic_network_games
                )
                domestic_network_games.clear()
            elif data_type == "jkwlyxspxx":
                foreign_network_games = self._parse_network_game_audits(
                    audits.url, data_type
                )
                foreign_network_game_cnt += len(foreign_network_games)
                network_game_audit.multiple_create(
                    db, objs_in=foreign_network_games
                )
                foreign_network_games.clear()
            elif data_type == "yxspbgxx":
                audit_changes = self._parse_game_alteration_audits(audits.url)
                audit_changes_cnt += len(audit_changes)
                game_alteration_audit.multiple_create(db, objs_in=audit_changes)
                audit_changes.clear()
            elif data_type == "yxspcxxx":
                audit_cancels = self._parse_game_revocation_audits(audits.url)
                audit_cancel_cnt += len(audit_cancels)
                game_revocation_audit.multiple_create(db, objs_in=audit_cancels)
                audit_cancels.clear()
            elif data_type == "jkdzyxspxx":
                egames = self._parse_egame_audits(audits.url)
                egame_audit_cnt += len(egames)
                egame_audit.multiple_create(db, objs_in=egames)
                egames.clear()

        logging.info(f"Saved total {domestic_network_game_cnt} domestic network games.")
        logging.info(f"Saved total {foreign_network_game_cnt} foreign network games.")
        logging.info(f"Saved total {audit_changes_cnt} game audit changes.")
        logging.info(f"Saved total {audit_cancel_cnt} game audit cancels.")
        logging.info(f"Saved total {egame_audit_cnt} foreign e-games.")

    def run(self, mode=0):
        """Entry of the crawler
        :param mode: 0 incremental data 1 full data, default 0
        """
        db: Session = next(deps.get_db())
        if mode == 0:
            self._get_latest_game_audits(db)
        else:
            self._get_all_game_audits(db)


def init_log():
    logging.basicConfig(level="INFO")
    logger = logging.getLogger("nppa_game_audit_scraper_logger")
    console_handler = logging.StreamHandler()
    console_handler.setLevel(level="DEBUG")
    console_log_format = "%(name)s--->%(asctime)--->%(message)--->%(lineno)d"
    formatter = logging.Formatter(fmt=console_log_format)
    console_handler.setFormatter(fmt=formatter)
    logger.addHandler(console_handler)


def main(argv):
    init_log()
    try:
        opts, args = getopt.getopt(argv, "hm:", ["help", "mode="])
    except getopt.GetoptError:
        print(
            "Error: -m <mode> pr --mode=<mode>, mode is 0 or 1. 0: incremental data, 1: full data"
        )
        sys.exit(2)
    mode = 0
    for opt, arg in opts:
        if opt in ("-h", "--help"):
            print(
                "Support parameter mode. e.g: -m <mode> or --mode=<mode>, mode is 0 or 1. 0: incremental data, "
                "1: full data"
            )
            sys.exit()
        elif opt in ("-m", "--mode"):
            arg = int(arg)
            if arg > 1 or arg < 0:
                print("Mode is only supported 0 or 1.")
                sys.exit(2)
            mode = arg
    crawler = NPPAGameAuditCrawler()
    crawler.run(mode)


if __name__ == "__main__":
    main(sys.argv[1:])