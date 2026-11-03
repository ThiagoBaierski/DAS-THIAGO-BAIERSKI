package br.com.sistemas.chamados.service;

import br.com.sistemas.chamados.dto.ChamadoRequest;
import br.com.sistemas.chamados.dto.ChamadoResponse;
import br.com.sistemas.chamados.entity.Chamado;
import br.com.sistemas.chamados.enums.StatusChamado;
import br.com.sistemas.chamados.exception.RecursoNaoEncontradoException;
import br.com.sistemas.chamados.repository.ChamadoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ChamadoService {

    private final ChamadoRepository repository;
    private final TecnicoService tecnicoService;
    private final CategoriaService categoriaService;
    private final ClienteService clienteService;

    ChamadoService(ChamadoRepository repository, TecnicoService tecnicoService, CategoriaService categoriaService, ClienteService clienteService) {
        this.repository = repository;
        this.tecnicoService = tecnicoService;
        this.categoriaService = categoriaService;
        this.clienteService = clienteService;
    }

    @Transactional
    public ChamadoResponse criar(ChamadoRequest dto) {

        Chamado salvo = repository.save(new Chamado(
                dto.titulo(),
                dto.descricao(),
                dto.prioridade(),
                tecnicoService.buscarEntity(dto.tecnicoId()),
                clienteService.buscarEntity(dto.clienteId()),
                categoriaService.buscarEntity(dto.categoriaId())
                ));
        return ChamadoResponse.de(salvo);
    }

    @Transactional(readOnly = true)
    public List<ChamadoResponse> listar() {
        return repository.findAll().stream().map(ChamadoResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public ChamadoResponse buscar(Long id) {
        return ChamadoResponse.de(buscarEntity(id));
    }

    @Transactional
    public ChamadoResponse atualizar(Long id, ChamadoRequest dto) {
        Chamado chamado = buscarEntity(id);
        chamado.setTitulo(dto.titulo());
        chamado.setDescricao(dto.descricao());
        chamado.setPrioridade(dto.prioridade());
        chamado.setStatus(dto.status());
        chamado.setTecnico(tecnicoService.buscarEntity(dto.tecnicoId()));
        chamado.setCliente(clienteService.buscarEntity(dto.clienteId()));
        chamado.setCategoria(categoriaService.buscarEntity(dto.categoriaId()));
        return ChamadoResponse.de(chamado);
    }
    @Transactional
    public ChamadoResponse fechar(Long id) {
        Chamado chamado = buscarEntity(id);
        chamado.setDataFechamento(LocalDateTime.now());
        chamado.setStatus(StatusChamado.FECHADO);
        return ChamadoResponse.de(chamado);
    }

    @Transactional
    public void excluir(Long id) {
        repository.delete(buscarEntity(id));
    }

    public Chamado buscarEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Chamado " + id + " não encontrado"));
    }
}