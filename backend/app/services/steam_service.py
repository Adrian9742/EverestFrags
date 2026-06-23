"""
steam_service — integração com Steam OpenID 2.0 e Steam Web API

Fluxo de autenticação:
  1. build_steam_redirect()  → monta a URL de redirecionamento para a Steam
  2. verify_steam_response() → valida a resposta da Steam e extrai o Steam ID
  3. get_steam_profile()     → busca nickname e avatar via Steam Web API

O Steam usa OpenID 2.0 (não OAuth 2.0). Não é necessária nenhuma biblioteca de
terceiros — a verificação é feita com um POST simples de volta ao endpoint da Steam.
"""

import httpx
from urllib.parse import urlencode

STEAM_OPENID_URL = "https://steamcommunity.com/openid/login"
STEAM_API_BASE = "https://api.steampowered.com"


def build_steam_redirect(return_to: str, realm: str) -> str:
    """
    Monta a URL para redirecionar o usuário ao login da Steam.

    Args:
        return_to: URL do backend que a Steam vai chamar após o login.
                   Ex: https://api.render.com/api/auth/steam/callback
        realm:     Domínio raiz da aplicação (deve bater com return_to).
                   Ex: https://api.render.com
    """
    params = {
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.mode": "checkid_setup",
        "openid.return_to": return_to,
        "openid.realm": realm,
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    }
    return f"{STEAM_OPENID_URL}?{urlencode(params)}"


async def verify_steam_response(params: dict) -> str | None:
    """
    Verifica a autenticidade da resposta da Steam após o redirect.

    Envia os mesmos parâmetros de volta para a Steam com openid.mode=check_authentication.
    Se a Steam confirmar, extrai o Steam ID do openid.claimed_id.

    Retorna o Steam ID (string de 64 bits) ou None se a verificação falhar.

    Bug conhecido: o dict de params deve conter todos os campos openid.* exatamente
    como a Steam os enviou. Modificar qualquer campo antes de verificar causa falha.
    """
    verify_params = dict(params)
    verify_params["openid.mode"] = "check_authentication"

    async with httpx.AsyncClient() as client:
        response = await client.post(STEAM_OPENID_URL, data=verify_params)

    if "is_valid:true" not in response.text:
        return None

    # claimed_id tem o formato: https://steamcommunity.com/openid/id/76561198XXXXXXXXX
    claimed_id = params.get("openid.claimed_id", "")
    if "/openid/id/" in claimed_id:
        return claimed_id.split("/openid/id/")[1].strip()

    return None


async def get_steam_profile(steam_id: str, api_key: str) -> dict | None:
    """
    Busca o perfil público do jogador via Steam Web API.

    Retorna dict com campos: personaname (nickname), avatarfull (URL do avatar), etc.
    Retorna None se a chave for inválida ou o perfil não for encontrado.

    Requer STEAM_API_KEY no .env — obtida em: https://steamcommunity.com/dev/apikey
    """
    if not api_key:
        return None

    url = f"{STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/"
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params={"key": api_key, "steamids": steam_id})

    players = response.json().get("response", {}).get("players", [])
    return players[0] if players else None
