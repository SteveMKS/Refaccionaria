export function numeroALetras(num: number): string {
    const formatter = new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    });
    const texto = formatter.format(num);
    return texto.replace("MXN", "pesos").replace("$", "").trim();
  }
  