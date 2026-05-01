INSERT INTO perfil (nome)
VALUES ('ADMIN')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO perfil (nome)
VALUES ('CLIENTE_PADRAO')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO perfil_permissoes (perfil_id, permissao)
SELECT p.id, 'TUDO'
FROM perfil p
WHERE p.nome = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO perfil_permissoes (perfil_id, permissao)
SELECT p.id, 'GERENCIAR_RESERVAS'
FROM perfil p
WHERE p.nome = 'CLIENTE_PADRAO'
ON CONFLICT DO NOTHING;

INSERT INTO usuario (nome, login, senha_hash, perfil_id)
VALUES (
           'Gerente Geral',
           'admin',
           '$2a$10$Ad5p9WTl78qWOWd9TMhIbu25DA7ISR2PSCE1sd17jh89nk7YjAG1q',
           1
       )
    ON CONFLICT (login) DO NOTHING;

insert into funcionario (matricula,id) values ('00001',1) ON CONFLICT (id) DO NOTHING;

insert into gerente (id) values (1) ON CONFLICT (id) DO NOTHING;