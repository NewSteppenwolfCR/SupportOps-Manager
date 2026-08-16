import secrets

from pwdlib import PasswordHash


password_hash = PasswordHash.recommended()


def generate_access_code() -> str:
    """
    Generates a cryptographically secure 6-digit access code.
    """
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_access_code(access_code: str) -> str:
    """
    Hashes an access code before storing it.
    """
    return password_hash.hash(access_code)


def verify_access_code(
    access_code: str,
    access_code_hash: str
) -> bool:
    """
    Verifies an access code against the stored hash.
    """
    if not access_code_hash:
        return False

    return password_hash.verify(
        access_code,
        access_code_hash
    )