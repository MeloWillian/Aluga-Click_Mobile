package br.edu.ifpb.alugaclick.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity(name = "Gerente")
@Getter
@Setter
@NoArgsConstructor
@Table(name = "gerente")
public class GerenteEntity extends FuncionarioEntity {

    public GerenteEntity(String nome, String login, String senhaHash, PerfilEntity perfil, String matricula) {
        super(nome, login, senhaHash, perfil, matricula);
    }
}