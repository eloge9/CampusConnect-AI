MAGIC_SIGNATURES: dict[str, tuple[bytes, ...]] = {
    "pdf": (b"%PDF",),
    "jpg": (b"\xff\xd8\xff",),
    "png": (b"\x89PNG\r\n\x1a\n",),
}


def detect_extension(content: bytes) -> str | None:
    """Identifie le vrai type d'un fichier à partir de sa signature binaire (magic bytes),
    plutôt que de faire confiance à l'extension du nom de fichier fourni par le client
    (facilement falsifiable — renommer un .exe en .pdf ne change pas son contenu réel)."""
    for extension, signatures in MAGIC_SIGNATURES.items():
        if content.startswith(signatures):
            return extension
    return None


def is_extension_allowed(detected_extension: str, allowed_extensions: set[str]) -> bool:
    normalized = {"jpg" if ext == "jpeg" else ext for ext in allowed_extensions}
    return detected_extension in normalized
