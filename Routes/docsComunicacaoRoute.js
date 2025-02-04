import express from 'express';
import Autenticar from '../middlewares/autenticar.js';
import docsComunicacaoController from '../Controllers/docsComunicacaoController.js';
import multer from 'multer';
import path from "path";

let router = express.Router();

let ctrl = new docsComunicacaoController();
let auth = new Autenticar();

let storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/img/Comunicacao');
    },
    filename: function(req, file, cb) {
        // Remove caracteres especiais do nome do arquivo e utiliza o nome original
        const sanitizedFilename = file.originalname
            .normalize("NFD") // Normaliza acentos e outros caracteres
            .replace(/[\u0300-\u036f]/g, '') // Remove marcas diacríticas
            .replace(/[^a-zA-Z0-9.]/g, '_'); // Substitui caracteres especiais por '_'
        
        cb(null, sanitizedFilename);
    }
});

let upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const tiposPermitidos = /jpeg|jpg|png|pdf|docx/; // Tipos permitidos (incluindo .docx)
        const extensaoValida = tiposPermitidos.test(path.extname(file.originalname).toLowerCase());
        const tipoMimeValido = tiposPermitidos.test(file.mimetype) || 
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; // Tipo MIME para .docx

        if (extensaoValida && tipoMimeValido) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não suportado!'));
        }
    }
});

router.post('/', auth.validar, upload.array("inputImage"), (req, res) => {
    // #swagger.tags = ['Documentos Comunicacao']
    // #swagger.summary = 'Cadastrar Imagem Comunicacao'
    
    ctrl.cadastrarDocsComunicacao(req, res);
});

router.get('/obter/:id', auth.validar, (req, res) => {
    // #swagger.tags = ['Documentos Comunicacao']
    // #swagger.summary = 'Retorna baseado em um id'
    /* #swagger.security = [{
            "bearerAuth": []
    }] */
    ctrl.obter(req, res);
});
router.put('/', auth.validar, upload.array("inputImage"), (req,res) =>{
    // #swagger.tags = ['Documentos Comunicacao']
    // #swagger.summary = 'Alterar Imagem Comunicacao'
    
    ctrl.alterarDocsComunicacao(req, res);
})
router.delete('/:id', auth.validar, (req,res) => {
    // #swagger.tags = ['Documentos Comunicacao']
    // #swagger.summary = 'Deletar um comunicacao especifico'
    ctrl.deletar(req,res);
});

export default router;