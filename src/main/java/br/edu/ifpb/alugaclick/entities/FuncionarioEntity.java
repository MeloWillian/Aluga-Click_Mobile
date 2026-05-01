package br.edu.ifpb.alugaclick.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.util.Set;
import java.util.HashSet;

@Entity(name = "Funcionario")
@Getter
@Setter
@NoArgsConstructor
@Table(name = "funcionario")
public class FuncionarioEntity extends UsuarioEntity {

    @Column(unique = true, nullable = false, length = 20)
    private String matricula;

    @OneToMany(mappedBy = "funcionario", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<LocacaoEntity> locacoesRegistradas = new HashSet<>();

    public FuncionarioEntity(String nome, String login, String senhaHash, PerfilEntity perfil, String matricula) {
        super(nome, login, senhaHash, perfil);
        this.matricula = matricula;
    }
}