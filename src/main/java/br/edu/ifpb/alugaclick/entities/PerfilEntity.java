package br.edu.ifpb.alugaclick.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.Set;

@Entity(name = "Perfil")
@Getter
@Setter
public class PerfilEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nome;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "perfil_permissoes", joinColumns = @JoinColumn(name = "perfil_id"))
    @Column(name = "permissao")
    private Set<String> permissoes;
}