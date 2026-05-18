const express = require('express');
const { Client } = require('pg');

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

async function conectarBanco() {

  const client = new Client({
    host: 'db',
    user: 'postgres',
    password: 'postgres',
    database: 'redesocial',
    port: 5432
  });

  try {

    await client.connect();

    console.log('Conectado ao PostgreSQL');

    // TABELA FOTOS

    await client.query(`
      CREATE TABLE IF NOT EXISTS fotos (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255),
        imagem TEXT,
        descricao TEXT,
        curtidas INTEGER DEFAULT 0
      )
    `);

    // TABELA COMENTÁRIOS

    await client.query(`
      CREATE TABLE IF NOT EXISTS comentarios (
        id SERIAL PRIMARY KEY,
        foto_id INTEGER,
        texto TEXT
      )
    `);

    // TABELA USUÁRIOS

    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255),
        email VARCHAR(255),
        senha VARCHAR(255)
      )
    `);

    // LISTAR FOTOS

    app.get('/fotos', async (req, res) => {

      const resultado = await client.query(
        'SELECT * FROM fotos ORDER BY id DESC'
      );

      res.json(resultado.rows);

    });

    // PUBLICAR FOTO

    app.post('/fotos', async (req, res) => {

      const {
        titulo,
        imagem,
        descricao
      } = req.body;

      await client.query(
        `
        INSERT INTO fotos
        (titulo, imagem, descricao)
        VALUES ($1, $2, $3)
        `,
        [titulo, imagem, descricao]
      );

      res.send('Foto publicada');

    });

    // EXCLUIR FOTO

    app.delete('/fotos/:id', async (req, res) => {

      const id = req.params.id;

      await client.query(
        'DELETE FROM fotos WHERE id = $1',
        [id]
      );

      res.send('Foto removida');

    });

    // CURTIR FOTO

    app.post('/fotos/:id/curtir', async (req, res) => {

      const id = req.params.id;

      await client.query(
        `
        UPDATE fotos
        SET curtidas = curtidas + 1
        WHERE id = $1
        `,
        [id]
      );

      res.send('Curtida adicionada');

    });

    // ADICIONAR COMENTÁRIO

    app.post('/comentarios', async (req, res) => {

      const {
        foto_id,
        texto
      } = req.body;

      await client.query(
        `
        INSERT INTO comentarios
        (foto_id, texto)
        VALUES ($1, $2)
        `,
        [foto_id, texto]
      );

      res.send('Comentário adicionado');

    });

    // LISTAR COMENTÁRIOS

    app.get('/comentarios/:foto_id', async (req, res) => {

      const foto_id = req.params.foto_id;

      const resultado = await client.query(
        `
        SELECT * FROM comentarios
        WHERE foto_id = $1
        `,
        [foto_id]
      );

      res.json(resultado.rows);

    });

    // CADASTRAR USUÁRIO

    app.post('/usuarios', async (req, res) => {

      const {
        nome,
        email,
        senha
      } = req.body;

      await client.query(
        `
        INSERT INTO usuarios
        (nome, email, senha)
        VALUES ($1, $2, $3)
        `,
        [nome, email, senha]
      );

      res.send('Usuário criado');

    });

    // LOGIN

    app.post('/login', async (req, res) => {

      const {
        email,
        senha
      } = req.body;

      const resultado = await client.query(
        `
        SELECT * FROM usuarios
        WHERE email = $1
        AND senha = $2
        `,
        [email, senha]
      );

      if (resultado.rows.length > 0) {

        res.send('Login realizado');

      } else {

        res.status(401).send('Usuário inválido');

      }

    });

    app.listen(3000, () => {

      console.log(
        'Servidor rodando na porta 3000'
      );

    });

  } catch (err) {

    console.log(
      'Banco ainda não disponível...'
    );

    console.log(err);

    setTimeout(conectarBanco, 5000);

  }

}

conectarBanco();