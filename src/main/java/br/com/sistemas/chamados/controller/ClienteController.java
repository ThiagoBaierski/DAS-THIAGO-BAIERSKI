package br.com.sistemas.chamados.controller;

import br.com.sistemas.chamados.dto.ClienteRequest;
import br.com.sistemas.chamados.dto.ClienteResponse;
import br.com.sistemas.chamados.service.ClienteService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/clientes")
public class ClienteController {

    private final ClienteService service;

    ClienteController(ClienteService clienteService, ClienteService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ClienteResponse> criar (
            @Valid @RequestBody ClienteRequest dto) {
        ClienteResponse criado = service.criar(dto);
        return ResponseEntity.created(URI.create("/clientes/" + criado.id())).body(criado);
    }

    @GetMapping
    public List<ClienteResponse> listar () {
        return service.listar();
    }

    @GetMapping("/{id}")
    public ClienteResponse buscar (@PathVariable Long id) {
        return service.buscar(id);
    }

    @PutMapping("/{id}")
    public ClienteResponse atualizar (
            @PathVariable Long id,
            @Valid @RequestBody ClienteRequest dto) {
        return service.atualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir (@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }

}
