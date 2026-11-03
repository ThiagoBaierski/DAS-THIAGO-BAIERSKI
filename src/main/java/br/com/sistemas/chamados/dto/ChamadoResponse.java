package br.com.sistemas.chamados.dto;

import java.time.LocalDateTime;

import br.com.sistemas.chamados.entity.Chamado;
import br.com.sistemas.chamados.enums.Prioridade;
import br.com.sistemas.chamados.enums.StatusChamado;

public record ChamadoResponse(
        Long id,
        String titulo,
        String descricao,
        LocalDateTime dataCriacao,
        LocalDateTime dataFechamento,
        Prioridade prioridade,
        StatusChamado status,
        Long tecnicoId,
        String tecnicoNome,
        Long clienteId,
        String clienteNome,
        Long categoriaId,
        String categoriaNome

) {
    public static ChamadoResponse de(Chamado c) {
        return new ChamadoResponse(
                c.getId(), c.getTitulo(), c.getDescricao(),
                c.getDataCriacao(), c.getDataFechamento(),
                c.getPrioridade(), c.getStatus(),
                c.getTecnico().getId(), c.getTecnico().getNome(),
                c.getCliente().getId(), c.getCliente().getNome(),
                c.getCategoria().getId(), c.getCategoria().getNome()
        );
    }
}