package br.com.sistemas.chamados.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.sistemas.chamados.dto.ComentarioRequest;
import br.com.sistemas.chamados.dto.ComentarioResponse;
import br.com.sistemas.chamados.service.ComentarioService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/comentarios")
class ComentarioController {

    private final ComentarioService service;

    public ComentarioController(ComentarioService comentarioService) {
        this.service = comentarioService;
    }

    @PostMapping
    public ResponseEntity<ComentarioResponse> criar
            (@Valid @RequestBody ComentarioRequest dto) {
        ComentarioResponse criado = service.criar(dto);
        return ResponseEntity.created(URI.create("/comentarios/" + criado.id())).body(criado);
    }

    @GetMapping("")
    public List<ComentarioResponse> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public ComentarioResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    @PutMapping("/{id}")
    public ComentarioResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody ComentarioRequest dto) {
        return service.atualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}