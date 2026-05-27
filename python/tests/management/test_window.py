import pytest
from agent_context.core.models import Message
from agent_context.management.window import SlidingWindow, TokenBudget


class FakeTokenizer:
    def count(self, text: str) -> int:
        return len(text)


def test_sliding_window_basic():
    messages = [Message(role="user", content=f"msg-{i}") for i in range(10)]
    strategy = SlidingWindow(max_messages=3)
    result = strategy.select(messages)
    assert len(result) == 3
    assert result[0].content == "msg-7"
    assert result[1].content == "msg-8"
    assert result[2].content == "msg-9"


def test_sliding_window_fewer_than_max():
    messages = [Message(role="user", content="x") for _ in range(2)]
    strategy = SlidingWindow(max_messages=5)
    result = strategy.select(messages)
    assert len(result) == 2


def test_sliding_window_zero():
    messages = [Message(role="user", content="x") for _ in range(3)]
    strategy = SlidingWindow(max_messages=0)
    result = strategy.select(messages)
    assert len(result) == 0


def test_token_budget_with_heuristic():
    messages = [Message(role="user", content="a" * 40)]
    strategy = TokenBudget(max_tokens=15)
    result = strategy.select(messages)
    assert len(result) == 1


def test_token_budget_keeps_recent():
    messages = [Message(role="user", content="a" * 40), Message(role="user", content="b" * 40)]
    strategy = TokenBudget(max_tokens=15)
    result = strategy.select(messages)
    assert len(result) == 1
    assert result[0].content == "b" * 40


def test_token_budget_drops_oldest():
    messages = [Message(role="user", content="a" * 40), Message(role="user", content="b" * 40), Message(role="user", content="c" * 40)]
    strategy = TokenBudget(max_tokens=20)
    result = strategy.select(messages)
    assert len(result) == 2
    assert result[0].content == "b" * 40
    assert result[1].content == "c" * 40


def test_token_budget_preserves_system_messages():
    messages = [Message(role="system", content="a" * 40), Message(role="user", content="b" * 40), Message(role="user", content="c" * 40)]
    strategy = TokenBudget(max_tokens=15)
    result = strategy.select(messages)
    assert len(result) == 2
    assert result[0].role == "system"
    assert result[1].content == "c" * 40


def test_token_budget_with_custom_tokenizer():
    messages = [Message(role="user", content="abc")]
    strategy = TokenBudget(max_tokens=5, tokenizer=FakeTokenizer())
    result = strategy.select(messages)
    assert len(result) == 1


def test_token_budget_empty_messages():
    strategy = TokenBudget(max_tokens=100)
    result = strategy.select([])
    assert result == []


def test_token_budget_exceeds_on_single_message():
    messages = [Message(role="user", content="a" * 100)]
    strategy = TokenBudget(max_tokens=10)
    result = strategy.select(messages)
    assert len(result) == 0
