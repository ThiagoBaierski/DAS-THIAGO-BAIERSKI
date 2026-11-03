package br.com.sistemas.chamados.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.sistemas.chamados.entity.Chamado;

public interface ChamadoRepository extends JpaRepository<Chamado, Long> {

}