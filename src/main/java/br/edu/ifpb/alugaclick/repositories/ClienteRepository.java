package br.edu.ifpb.alugaclick.repositories;

import br.edu.ifpb.alugaclick.entities.ClienteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<ClienteEntity, Long> {
    List<ClienteEntity> findByNomeContainingIgnoreCase(String nome);
    Optional<ClienteEntity> findByCpf(String cpf);

    Optional<ClienteEntity> findByLogin(String nome);
}