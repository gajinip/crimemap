"""Assistant proxy.

Replaces the browser-side call that currently ships `VITE_OPENAI_API_KEY`
(see CRIMEMAP_SECURITY_REVIEW.md). The key is read from the server environment
only; when it is absent a deterministic digest answer is returned so the
endpoint stays usable in air-gapped / demo runs.
"""

from __future__ import annotations

import os

import httpx
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/assistant", tags=["assistant"])

OPENAI_URL = "https://api.openai.com/v1/chat/completions"
SYSTEM_PROMPT = (
    "You are CRIMEMAP's analyst assistant. Answer strictly from the supplied "
    "operational digest. Be concise, cite the areas and figures you use, and "
    "never invent incidents."
)


class Message(BaseModel):
    role: str
    content: str


class AskRequest(BaseModel):
    messages: list[Message]
    digest: str = ""


class AskResponse(BaseModel):
    answer: str
    source: str


def _fallback(digest: str, question: str) -> str:
    digest = digest.strip()
    if not digest:
        return (
            "No operational digest was supplied, so I cannot ground an answer. "
            f"Question received: {question[:200]}"
        )
    return (
        "Live model is not configured on this server; returning the grounded "
        f"digest instead.\n\n{digest}"
    )


@router.post("/ask", response_model=AskResponse)
def ask(payload: AskRequest) -> AskResponse:
    api_key = os.environ.get("OPENAI_API_KEY")
    question = next(
        (m.content for m in reversed(payload.messages) if m.role == "user"), ""
    )
    if not api_key:
        return AskResponse(answer=_fallback(payload.digest, question), source="fallback")

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if payload.digest:
        messages.append(
            {"role": "system", "content": f"Operational digest:\n{payload.digest}"}
        )
    messages.extend(m.model_dump() for m in payload.messages)

    try:
        with httpx.Client(timeout=30) as client:
            response = client.post(
                OPENAI_URL,
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
                    "messages": messages,
                    "temperature": 0.2,
                },
            )
            response.raise_for_status()
            data = response.json()
        answer = data["choices"][0]["message"]["content"].strip()
        return AskResponse(answer=answer, source="openai")
    except (httpx.HTTPError, KeyError, IndexError, ValueError):
        return AskResponse(answer=_fallback(payload.digest, question), source="fallback")
