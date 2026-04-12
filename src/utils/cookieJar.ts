interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: Date;
  secure?: boolean;
  httpOnly?: boolean;
}

export class CookieJar {
  private cookies: Map<string, Cookie> = new Map();

  parseSetCookieHeaders(headers: Record<string, string>): void {
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === "set-cookie") {
        this.parseSetCookie(value);
      }
    }
  }

  private parseSetCookie(header: string): void {
    const parts = header.split(";").map((p) => p.trim());
    if (parts.length === 0) return;

    const [nameValue, ...attributes] = parts;
    const eqIndex = nameValue.indexOf("=");
    if (eqIndex === -1) return;

    const name = nameValue.substring(0, eqIndex).trim();
    const value = nameValue.substring(eqIndex + 1).trim();
    if (!name) return;

    const cookie: Cookie = { name, value };

    for (const attr of attributes) {
      const [attrName, ...attrValueParts] = attr.split("=");
      const attrValue = attrValueParts.join("=").trim();

      switch (attrName.trim().toLowerCase()) {
        case "domain":
          cookie.domain = attrValue;
          break;
        case "path":
          cookie.path = attrValue;
          break;
        case "expires":
          cookie.expires = new Date(attrValue);
          break;
        case "secure":
          cookie.secure = true;
          break;
        case "httponly":
          cookie.httpOnly = true;
          break;
      }
    }

    this.cookies.set(name, cookie);
  }

  getCookieHeader(): string {
    const now = new Date();
    const validCookies: string[] = [];

    for (const [, cookie] of this.cookies) {
      if (cookie.expires && cookie.expires < now) continue;
      validCookies.push(`${cookie.name}=${cookie.value}`);
    }

    return validCookies.join("; ");
  }

  isEmpty(): boolean {
    return this.cookies.size === 0;
  }
}
