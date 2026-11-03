package br.com.sistemas.chamados.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.sistemas.chamados.entity.Chamado;
import br.com.sistemas.chamados.enums.StatusChamado;

public interface ChamadoRepository extends JpaRepository<Chamado, Long> {

    boolean existsByStatus(StatusChamado status);

}