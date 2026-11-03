package br.com.sistemas.chamados.controller;

import br.com.sistemas.chamados.dto.ChamadoRequest;
import br.com.sistemas.chamados.dto.ChamadoResponse;
import br.com.sistemas.chamados.service.ChamadoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/chamados")
class ChamadoController {

    private final ChamadoService service;
    public ChamadoController(ChamadoService chamadoService) {
        this.service = chamadoService;
    }

    @PostMapping()
    public ResponseEntity<ChamadoResponse> criar (
            @Valid @RequestBody ChamadoRequest dto) {
        ChamadoResponse criado = service.criar(dto);
        return ResponseEntity.created(URI.create("/chamados/" + criado.id())).body(criado);
    }

    @GetMapping()
    public List<ChamadoResponse> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public ChamadoResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    @PutMapping("/{id}")
    public ChamadoResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody ChamadoRequest dto) {
        return service.atualizar(id, dto);
    }

    @PutMapping("/fechar/{id}")
    public ChamadoResponse fechar(
            @PathVariable Long id) {
        return service.fechar(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}