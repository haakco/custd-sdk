export function basicAuthorization(clientId, clientSecret) {
    const bytes = new TextEncoder().encode(`${clientId}:${clientSecret}`);
    let binary = "";
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return `Basic ${btoa(binary)}`;
}
