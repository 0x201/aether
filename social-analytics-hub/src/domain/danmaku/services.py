"""领域服务：纯计算，不注入仓储、不访问 I/O。"""

from collections import Counter
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class WordFrequency:
    """单词出现频次。"""

    word: str
    count: int


class WordFrequencyDomainService:
    """中文分词与词频统计。

    分词器在实例化时构建一次（jieba 词典加载开销较大），因此本服务在容器中
    以单例方式注册。
    """

    STOP_WORDS: frozenset[str] = frozenset(
        {
            " ",
            "\t",
            "\n",
            "，",
            "。",
            "！",
            "？",
            "；",
            "：",
            "、",
            "我",
            "你",
            "他",
            "她",
            "它",
            "我们",
            "你们",
            "他们",
            "她们",
            "它们",
            "自己",
            "本人",
            "他人",
            "人家",
            "谁",
            "哪儿",
            "哪里",
            "怎样",
            "多少",
            "如何",
            "什么",
            "哪个",
            "的",
            "了",
            "着",
            "过",
            "地",
            "得",
            "所",
            "似的",
            "在",
            "从",
            "向",
            "往",
            "朝",
            "沿着",
            "顺着",
            "比",
            "跟",
            "给",
            "替",
            "让",
            "被",
            "于",
            "由",
            "以",
            "把",
            "将",
            "对",
            "对于",
            "关于",
            "至于",
            "和",
            "与",
            "同",
            "及",
            "或",
            "以及",
            "不但",
            "不仅",
            "而且",
            "并且",
            "虽然",
            "但是",
            "然而",
            "不过",
            "可是",
            "只是",
            "如果",
            "假如",
            "只要",
            "一旦",
            "要是",
            "就",
            "便",
            "才",
            "则",
            "于是",
            "所以",
            "因此",
            "因为",
            "由于",
            "不",
            "没",
            "别",
            "莫",
            "休",
            "勿",
            "未",
            "否",
            "是否",
            "也许",
            "大概",
            "或许",
            "反正",
            "确实",
            "实在",
            "总之",
            "究竟",
            "到底",
            "难道",
            "居然",
            "竟然",
            "好",
            "行",
            "是",
            "有",
            "还",
            "也",
            "都",
            "又",
            "很",
            "挺",
            "怪",
            "蛮",
            "比较",
            "非常",
            "特别",
            "十分",
            "极其",
            "格外",
            "过于",
            "尤其",
            "相当",
            "稍微",
            "略微",
            "一",
            "一个",
            "两个",
            "一些",
            "几个",
            "一点",
            "几点",
            "几",
            "几许",
            "若干",
            "些许",
            "一丁点",
            "一点点",
            "一切",
            "所有",
            "全部",
            "完全",
            "整个",
            "全体",
            "统统",
            "通通",
            "全",
            "均",
            "皆",
            "尽",
            "共",
            "总",
            "整",
            "双",
            "两",
            "三",
            "四",
            "五",
            "六",
            "七",
            "八",
            "九",
            "十",
            "这个",
            "那个",
            "这里",
            "那里",
            "这样",
            "那样",
            "这么",
            "那么",
            "这",
            "那",
            "这边",
            "那边",
            "这儿",
            "那儿",
            "如今",
            "当时",
            "现在",
            "过去",
            "将来",
            "今天",
            "明天",
            "昨天",
            "时候",
            "会",
            "能",
            "可",
            "可能",
            "可以",
            "应该",
            "应当",
            "要",
            "需要",
            "想",
            "希望",
            "愿意",
            "去",
            "来",
            "看",
            "看见",
            "看到",
            "听到",
            "听见",
            "觉得",
            "感觉",
            "感到",
            "感受",
            "知道",
            "了解",
            "明白",
            "清楚",
            "认为",
            "以为",
            "看起来",
        }
    )

    #: 参与统计的词最短长度（单字词噪声过大，默认过滤）
    MIN_WORD_LENGTH: int = 2

    #: 词频查询默认 Top-N
    DEFAULT_TOP_N: int = 100

    #: 词云查询默认 Top-N
    DEFAULT_WORDCLOUD_TOP_N: int = 200

    def __init__(self, tokenizer: object | None = None) -> None:
        if tokenizer is None:
            import jieba3

            tokenizer = jieba3.jieba3()
        self._tokenizer = tokenizer

    def tokenize(self, text: str) -> list[str]:
        """分词并过滤停用词与过短词。"""
        if not text or not text.strip():
            return []
        words = self._tokenizer.cut_text(text)
        return [
            word
            for word in words
            if len(word) >= self.MIN_WORD_LENGTH and word not in self.STOP_WORDS
        ]

    def top_words(self, text: str, top_n: int = 100) -> list[WordFrequency]:
        """返回按频次降序排列的 Top-N 词频。"""
        if top_n <= 0:
            raise ValueError("top_n must be a positive integer")
        counter = Counter(self.tokenize(text))
        return [
            WordFrequency(word=word, count=count)
            for word, count in counter.most_common(top_n)
        ]

    def wordcloud(self, text: str, top_n: int | None = None) -> list[WordFrequency]:
        """返回词云数据（按频次降序）。"""
        return self.top_words(
            text, top_n=self.DEFAULT_WORDCLOUD_TOP_N if top_n is None else top_n
        )
