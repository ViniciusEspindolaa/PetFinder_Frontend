import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X, MapPin } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface ServiceFiltersProps {
  tipo?: string
  busca?: string
  cidade?: string
  abertoAgora?: boolean
  onTipoChange: (value: string) => void
  onBuscaChange: (value: string) => void
  onCidadeChange: (value: string) => void
  onAbertoAgoraChange: (value: boolean) => void
  onLimpar: () => void
}

export function ServiceFilters({
  tipo,
  busca,
  cidade,
  abertoAgora,
  onTipoChange,
  onBuscaChange,
  onCidadeChange,
  onAbertoAgoraChange,
  onLimpar,
}: ServiceFiltersProps) {
  const tipoOptions = [
    { value: "PET_SITTER", label: "Pet Sitter" },
    { value: "DOG_WALKER", label: "Dog Walker" },
    { value: "BANHO_TOSA", label: "Banho e Tosa" },
    { value: "HOSPEDAGEM_CRECHE", label: "Hospedagem/Creche" },
    { value: "ADESTRADOR", label: "Adestrador" },
  ]

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Nome ou descrição..."
              value={busca || ""}
              onChange={(e) => onBuscaChange(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Cidade / Bairro</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Cidade ou bairro..."
              value={cidade || ""}
              onChange={(e) => onCidadeChange(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Tipo de Serviço</label>
          <Select value={tipo} onValueChange={onTipoChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar tipo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {tipoOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex flex-row items-center gap-2">
          <Switch 
            id="aberto-agora" 
            checked={abertoAgora || false} 
            onCheckedChange={onAbertoAgoraChange} 
          />
          <label
            htmlFor="aberto-agora"
            className="text-sm font-medium leading-none cursor-pointer"
          >
            Aberto Agora
          </label>
        </div>

        {(tipo || busca || cidade || abertoAgora) && (
          <Button
            variant="outline"
            size="sm"
            onClick={onLimpar}
          >
            <X className="w-4 h-4 mr-2" />
            Limpar Filtros
          </Button>
        )}
      </div>
    </div>
  )
}
