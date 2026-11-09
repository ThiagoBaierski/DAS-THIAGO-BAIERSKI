package br.com.sistemas.chamados.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.sistemas.chamados.entity.Comentario;

public interface ComentarioRepository extends JpaRepository<Comentario, Long> {

}