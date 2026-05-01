package br.edu.ifpb.alugaclick.services;

import br.edu.ifpb.alugaclick.entities.FuncionarioEntity;
import br.edu.ifpb.alugaclick.entities.ReservaEntity;
import br.edu.ifpb.alugaclick.entities.LocacaoEntity;
import br.edu.ifpb.alugaclick.repositories.ReservaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final LocacaoService locacaoService;

    @Autowired
    public ReservaService(ReservaRepository reservaRepository, LocacaoService locacaoService) {
        this.reservaRepository = reservaRepository;
        this.locacaoService = locacaoService;
    }

    @Transactional
    public LocacaoEntity confirmarReserva(ReservaEntity reserva, FuncionarioEntity funcionario, String formaPagamento) {
        reserva.setStatus("CONFIRMADA");
        reservaRepository.save(reserva);

        return locacaoService.criarNovaLocacao(reserva, funcionario, formaPagamento);
    }

    @Transactional
    public boolean criarReserva(ReservaEntity reserva) {
        try {
            reserva.setStatus("PENDENTE");
            reservaRepository.save(reserva);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Transactional
    public boolean cancelarReserva(ReservaEntity reserva) {
        reserva.setStatus("CANCELADA");
        reservaRepository.save(reserva);
        return true;
    }

    public boolean enviarConfirmacaoEmail(ReservaEntity reserva) {
        System.out.println("Enviando email de confirmação para reserva #" + reserva.getId());
        return true;
    }

    @Transactional(readOnly = true)
    public Optional<ReservaEntity> pesquisarReservaPorId(Long id) {
        return reservaRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<ReservaEntity> listarTodas() {
        return reservaRepository.findAll();
    }
}