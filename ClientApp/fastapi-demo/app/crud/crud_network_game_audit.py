# coding=utf-8

from typing import Optional

from sqlalchemy import or_, text, func
from sqlalchemy.orm import Session

from app import models
from app.crud.base import CRUDBase
from app.models.network_game_audit import NetworkGameAudit
from app.schemas import (
    PagedResult,
    Chart,
    BarSeries,
    Legend,
    BackgroundStyle,
    Axis,
    ChartTitle,
)
from app.schemas.chart import (
    LineSeries,
    ChartGrid,
    Toolbox,
    ToolboxFeature,
    ChartTooltip,
    AxisLabel,
)
from app.schemas.network_game_audit import (
    NetworkGameAuditCreate,
    NetworkGameAuditUpdate,
)


class CRUDNetworkGameAudit(
    CRUDBase[NetworkGameAudit, NetworkGameAuditCreate, NetworkGameAuditUpdate]
):
    def create(self, db: Session, *, obj_in: NetworkGameAudit) -> NetworkGameAudit:
        db.add(obj_in)
        db.commit()
        db.refresh(obj_in)
        return obj_in

    def get_paged_network_games_audits(
        self, db: Session, query_str: Optional[str], skip: int = 0, limit: int = 10
    ) -> PagedResult:
        query = db.query(NetworkGameAudit)
        if query_str:
            query = query.filter(
                or_(
                    models.NetworkGameAudit.name.like(f"%{query_str}%"),
                    models.NetworkGameAudit.publisher.like(f"%{query_str}%"),
                    models.NetworkGameAudit.operator.like(f"%{query_str}%"),
                )
            )

        audits = query.offset(skip).limit(limit).all()
        total_count = query.count()
        return PagedResult(total_count=total_count, data=audits)

    def get_all(self, db: Session) -> list[NetworkGameAudit]:
        return (
            db.query(NetworkGameAudit)
            .order_by(NetworkGameAudit.publish_date.desc())
            .all()
        )

    def multiple_create(self, db: Session, *, objs_in: list[NetworkGameAudit]) -> None:
        db.add_all(objs_in)
        db.commit()

    def delete_all(self, db: Session) -> None:
        db.query(NetworkGameAudit).delete()
        db.commit()

    def is_empty(self, db: Session) -> bool:
        return False if db.query(NetworkGameAudit).first() else True

    def get_audit_category_top_10(self, db: Session, category: Optional[int]) -> Chart:
        """Get the top 10 audit category
        :param category: the category of game e.g: 1: domestic 2: foreign
        """
        query = db.query(
            NetworkGameAudit.audit_category, func.count(text("*")).label("audit_count")
        )
        if category:
            query = query.filter(NetworkGameAudit.category == category)

        result_proxy = (
            query.group_by(NetworkGameAudit.audit_category)
            .order_by(text("audit_count desc"))
            .limit(10)
            .all()
        )

        x_axis = Axis(
            type="category", data=[], axisLabel=AxisLabel(interval=0, rotate=75)
        )
        y_axis = Axis(type="value", data=[], axisLabel=AxisLabel())
        title = ChartTitle(text="Domestic/Foreign network game audits")
        series = BarSeries(
            name="audit_counts",
            data=[],
            showBackground=True,
            backgroundStyle=BackgroundStyle(color="rgba(180, 180, 180, 0.2)"),
        )

        for item in result_proxy:
            x_axis.data.append(item[0])
            series.data.append(item[1])

        chart = Chart(
            title=title,
            legend=Legend(data=["audit_counts"]),
            yAxis=y_axis,
            series=[series],
            xAxis=x_axis,
        )
        return chart

    def get_publisher_top_10(self, db: Session, category: Optional[int]) -> Chart:
        query = db.query(
            NetworkGameAudit.publisher, func.count(text("*")).label("audit_count")
        )
        if category:
            query = query.filter(NetworkGameAudit.category == category)

        result_proxy = (
            query.group_by(NetworkGameAudit.publisher)
            .order_by(text("audit_count desc"))
            .limit(10)
            .all()
        )

        x_axis = Axis(
            type="category", data=[], axisLabel=AxisLabel(interval=0, rotate=75)
        )
        y_axis = Axis(type="value", data=[], axisLabel=AxisLabel())
        title = ChartTitle(text="Network Game Publisher Top 10")
        legend = Legend(data=["audit_counts"])
        series = BarSeries(
            name="audit_counts",
            data=[],
            showBackground=True,
            backgroundStyle=BackgroundStyle(color="rgba(180, 180, 180, 0.2)"),
        )

        for item in result_proxy:
            x_axis.data.append(item[0])
            series.data.append(item[1])

        chart = Chart(
            title=title, xAxis=x_axis, yAxis=y_axis, legend=legend, series=[series]
        )
        return chart

    def get_audits_per_year(self, db: Session) -> Chart:
        query = db.query(
            func.year(NetworkGameAudit.publish_date).label("year"),
            NetworkGameAudit.category,
            func.count(text("*")).label("audit_count"),
        )
        result_proxy = (
            query.group_by(
                func.year(NetworkGameAudit.publish_date), NetworkGameAudit.category
            )
            .order_by(text("year"))
            .all()
        )

        title = ChartTitle(text="Network Game Audits per Year")
        total_series = LineSeries(
            name="total",
            data=[],
            showBackground=True,
            stack="Total",
            backgroundStyle=BackgroundStyle(color="rgba(180, 180, 180, 0.2)"),
        )

        domestic_series = LineSeries(
            name="domestic",
            data=[],
            showBackground=True,
            stack="Total",
            backgroundStyle=BackgroundStyle(color="rgba(180, 180, 180, 0.2)"),
        )

        foreign_series = LineSeries(
            name="foreign",
            data=[],
            showBackground=True,
            stack="Total",
            backgroundStyle=BackgroundStyle(color="rgba(180, 180, 180, 0.2)"),
        )
        total = {}
        years_set = set()
        year_with_category = set()
        result_without_value = set()
        for item in result_proxy:
            years_set.add(item[0])
            result_without_value.add((item[0], item[1]))

        for item in years_set:
            year_with_category.add((item, 1))
            year_with_category.add((item, 2))

        for item in sorted(year_with_category):
            if item not in result_without_value:
                result_proxy.insert(0, (item[0], item[1], 0))

        for item in result_proxy:
            year = item[0]
            if year in total:
                total[year] += item[2]
            else:
                total[year] = item[2]
            category = item[1]
            if category == 1:
                domestic_series.data.append(item[2])
            else:
                foreign_series.data.append(item[2])

        # assemble chart
        years = list(years_set)
        years.sort()
        years = map(lambda x: str(x), years)
        x_axis = Axis(type="category", data=years, axisLabel=AxisLabel())
        y_axis = Axis(type="value")
        grid = ChartGrid(left="3%", right="4%", bottom="3%", containLabel=True)
        toolbox = Toolbox(feature=ToolboxFeature(saveAsImage={}))
        tooltip = ChartTooltip(trigger="axis")
        total_series.data = list(total.values())
        chart = Chart(
            title=title,
            legend=Legend(data=["total", "domestic", "foreign"]),
            yAxis=y_axis,
            series=[total_series, domestic_series, foreign_series],
            xAxis=x_axis,
            grid=grid,
            toolbox=toolbox,
            tooltip=tooltip,
        )
        return chart


network_game_audit = CRUDNetworkGameAudit(NetworkGameAudit)
