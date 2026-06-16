export const SERVICE_TYPE_LABELS: Record<string, string> = {
  PET_SITTER: "Pet Sitter",
  DOG_WALKER: "Dog Walker",
  BANHO_TOSA: "Banho e Tosa",
  HOSPEDAGEM_CRECHE: "Hospedagem/Creche",
  ADESTRADOR: "Adestrador",
  VETERINARIO: "Veterinário",
  PET_SHOP: "Pet Shop",
  TREINADOR: "Treinador",
  PASSEADOR: "Passeador",
  HOSPEDAGEM: "Hospedagem",
  GROOMING: "Banho e Tosa",
  OUTROS: "Outros",
}

export function getServiceTypeLabel(tipo?: string | null): string {
  if (!tipo) return "Serviço"
  return SERVICE_TYPE_LABELS[tipo] ?? tipo.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
}
