from dataclasses import dataclass


@dataclass
class FanMedal(frozen=True):
    name: str
    level: int
