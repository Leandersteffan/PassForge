// common/strength.js
(() => {
  // --- helpers ---------------------------------------------------------------
  const COMMON = new Set([
    "password","123456","123456789","qwerty","111111","12345678","abc123",
    "password1","1234567","123123","iloveyou","admin","welcome","monkey",
    "dragon","letmein","login","princess","passforge" 
  ]);

  const hasLower = s => /[a-z]/.test(s);
  const hasUpper = s => /[A-Z]/.test(s);
  const hasDigit = s => /\d/.test(s);
  const hasSymbol = s => /[^A-Za-z0-9]/.test(s);
  const hasUnicode = s => /[\u0080-\uFFFF]/.test(s);

  function charsetSize(s) {
    let n = 0;
    if (hasLower(s)) n += 26;
    if (hasUpper(s)) n += 26;
    if (hasDigit(s)) n += 10;
    if (hasSymbol(s)) n += 33;       // rough printable symbols
    if (hasUnicode(s)) n += 1000;    // conservative bump
    return Math.max(n, 1);
  }

  function repeatsPenalty(s) {
    // penalize long runs: aaa, or abababa style
    let p = 0;
    if (/(.)\1{2,}/.test(s)) p += 12;        // same char 3+
    if (/(..)\1{2,}/.test(s)) p += 10;       // 2-char pattern repeated
    if (/(.{3})\1{1,}/.test(s)) p += 8;      // 3-char chunk repeated
    return p;
  }

  function sequencePenalty(s) {
    // detect simple sequences like abcd / 1234 / ABCD
    const lowers = "abcdefghijklmnopqrstuvwxyz";
    const uppers = lowers.toUpperCase();
    const digits = "0123456789";
    const bases = [lowers, uppers, digits];

    let p = 0;
    for (const base of bases) {
      for (let i = 0; i <= base.length - 4; i++) {
        const sub = base.slice(i, i + 4);
        if (s.includes(sub)) p += 10;
      }
    }
    return p;
  }

  function estimateBits(s) {
    // Upper bound Shannon-ish estimate: log2(|charset|^len) = len*log2(|charset|)
    return Math.log2(charsetSize(s)) * s.length;
  }

  // --- public API ------------------------------------------------------------
  function score(password) {
    const p = String(password || "");
    if (!p) return { score: 0, label: "Very weak", bits: 0 };

    const lower = p.toLowerCase();

    let bits = estimateBits(p);

    // Obvious bads
    if (COMMON.has(lower)) bits -= 45;
    if (/^\d{6,}$/.test(p)) bits -= 25; // all digits 6+

    // Pattern penalties
    bits -= repeatsPenalty(lower);
    bits -= sequencePenalty(lower);

    // Good practice bonuses
    if (p.length >= 12) bits += 8;
    if (hasLower(p) && hasUpper(p) && hasDigit(p) && hasSymbol(p)) bits += 10;

    // Clamp and bucketize
    bits = Math.max(0, Math.min(bits, 200));

    let bucket = 0, label = "Very weak";
    if (bits >= 30) { bucket = 1; label = "Weak"; }
    if (bits >= 45) { bucket = 2; label = "Fair"; }
    if (bits >= 65) { bucket = 3; label = "Strong"; }
    if (bits >= 85) { bucket = 4; label = "Excellent"; }

    return { score: bucket, label, bits: Math.round(bits) };
  }

  function generate(opts = {}) {
    const length = Math.min(Math.max(Number(opts.length) || 16, 8), 64);
    const useUpper = opts.upper !== false;
    const useLower = opts.lower !== false;
    const useDigits = opts.digits !== false;
    const useSymbols = !!opts.symbols;

    const lowers = "abcdefghijklmnopqrstuvwxyz";
    const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digits = "0123456789";
    const symbols = "!@#$%^&*()-_=+[]{};:,.?/";

    let pools = [];
    if (useLower)  pools.push(lowers);
    if (useUpper)  pools.push(uppers);
    if (useDigits) pools.push(digits);
    if (useSymbols) pools.push(symbols);
    if (pools.length === 0) pools = [lowers];

    // ensure at least one from each selected class
    const arr = [];
    for (const pool of pools) {
      arr.push(pool[randomIndex(pool.length)]);
    }

    // fill the rest from all selected pools combined
    const all = pools.join("");
    while (arr.length < length) {
      arr.push(all[randomIndex(all.length)]);
    }

    // crypto Fisher–Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = randomIndex(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr.join("");
  }

  function randomIndex(max) {
    const u = new Uint32Array(1);
    crypto.getRandomValues(u);
    // convert to 0..max-1 without bias big enough to matter here
    return Math.floor((u[0] / 2**32) * max);
  }

  // expose in both popup and content contexts
  window.PassForge = { score, generate };
})();
