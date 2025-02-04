'use client'
import { useEffect, useRef, useState, useContext } from "react"
import { useRouter } from "next/navigation";
import Link from "next/link";
import EmpContext from "../context/empContext.js";
import UserContext from "../context/userContext.js";

export default function FormProtocolo(props){

    let router = useRouter();
    const { user, setUser } = useContext(UserContext); // usuário que vem do contexto que está logado
    const { emp, setEmp } = useContext(EmpContext); // empresa que vem do localStorage
    const [arquivos, setArquivos] = useState([]);
    const [loading, setLoading] = useState(false);

    const usuario = user.usuId;
    const empresa = emp.empId;

    let protocolo = 
    props.protocolo != null ? 
        props.protocolo 
    : 
        {  
            protId: "", protTitulo: "", protTipo: "", protData: "", protDescricao: ""
        }

    let docsProtocolo = 
    props.docsProtocolo != null ? 
        props.docsProtocolo 
    : 
        {  
            protDocsId: "", protId: "", protDocsNome: ""
        }    

    let isAlteracao = protocolo.protId != null && protocolo.protId !== "";

    let [arquivoAlterado, setArquivoAlterado] = useState({
        docsEncontrados: [],
    });

    useEffect(() => {
        if (isAlteracao && JSON.stringify(arquivoAlterado) !== JSON.stringify(docsProtocolo)) {
            setArquivoAlterado(docsProtocolo);
        }
    }, [docsProtocolo, isAlteracao]);

    //impede de acessar caso não tenha uma empresa//
    useEffect(() => {
        // Verifica se a empresa está selecionada
        if (!emp) {
            // Redireciona para a página de empresas se nenhuma empresa estiver selecionada
            router.push("/admin/empresas");
        } else {
            setLoading(false);
        }
    }, [emp, router]);

    if (loading || !emp || !user) {
        return <div>Carregando...</div>;
    }
    ///////////////////////////////////////////////

    function normalizeFileName(name) {
        return name
            .normalize("NFD") // Normaliza acentos e outros caracteres
            .replace(/[\u0300-\u036f]/g, '') // Remove marcas diacríticas
            .replace(/[^a-zA-Z0-9.]/g, '_') // Substitui caracteres especiais por '_'
            .toLowerCase(); // Converte tudo para minúsculas
    }
    
    function handleFileChange(event) {
        const selectedFiles = Array.from(event.target.files);
    
        // Normaliza nomes existentes (arquivos já carregados e arquivos no protocolo)
        const nomesExistentes = [
            ...arquivos.map(file => normalizeFileName(file.name)),
            ...(arquivoAlterado.docsEncontrados?.map(doc => normalizeFileName(doc.protDocsNome)) || []),
        ];
    
        // Tipos de arquivos aceitos
        const tiposAceitos = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf'];
    
        const novosArquivos = selectedFiles.filter(file => {
            const fileName = normalizeFileName(file.name); // Normaliza o nome selecionado
    
            // Verifica se o arquivo já foi selecionado
            if (nomesExistentes.includes(fileName)) {
                alert(`O arquivo "${file.name}" já foi selecionado.`);
                return false;
            }
    
            // Verifica se o tipo de arquivo é válido
            if (!tiposAceitos.includes(file.type)) {
                alert(`O arquivo "${file.name}" não é um tipo aceito. Apenas PNG, JPG, JPEG e PDF são permitidos.`);
                return false;
            }
    
            return true;
        });
    
        // Adiciona os novos arquivos ao estado
        setArquivos(prevArquivos => [...prevArquivos, ...novosArquivos]);
    }

    console.log(docsProtocolo)

    const removerArquivo = (index) => {
        setArquivos((prevFiles) => prevFiles.filter((_, i) => i !== index));
    };

    const removerArquivoAlterado = async (index) => {

        console.log(index)
        if(confirm("Tem certeza que deseja deletar este arquivo?")){

            let id = index;
    
            try {
                // Faz a requisição para deletar o arquivo no servidor
                let response = await fetch(`http://localhost:5000/docsProtocolo/${id}`, {
                    mode: 'cors',
                    credentials: 'include',
                    method: "DELETE",
                });
        
                if (!response.ok) {
                    throw new Error('Erro ao excluir arquivo');
                }
        
                // Após a exclusão bem-sucedida, atualiza o estado local
                setArquivoAlterado((prevState) => {
                    const updatedDocs = prevState.docsEncontrados.filter(doc => doc.protDocsId !== id);
                    console.log("Arquivos após a exclusão:", updatedDocs);  // Verificando os arquivos após remoção
                    return { ...prevState, docsEncontrados: updatedDocs };
                });
        
                console.log('Arquivo excluído com sucesso!');
            } catch (error) {
                console.error('Erro ao excluir o arquivo:', error);
            }
        }
        
    };

    

    let titulo = useRef("");
    let tipo = useRef("");
    let data = useRef("");
    let descricao = useRef("");
    let img = useRef("")

    let msgRef = useRef(null);
    
    let [erroTitulo, setErroTitulo] = useState(false);
    let [erroTipo, setErroTipo] = useState(false);
    let [erroData, setErroData] = useState(false);
    let [erroDescricao, setErroDescricao] = useState(false);
    //let dataFormatada = new Date(protocolo.protData).toISOString().slice(0, 10);

    function gravarProtocolo() {
        let ok = true;
    
        if (titulo.current.value === "") {
            setErroTitulo(true);
            ok = false;
        } else {
            setErroTitulo(false);
        }
    
        if (tipo.current.value === "") {
            setErroTipo(true);
            ok = false;
        } else {
            setErroTipo(false);
        }
    
        if (data.current.value === "") {
            setErroData(true);
            ok = false;
        } else {
            setErroData(false);
        }
    
        if (descricao.current.value === "") {
            setErroDescricao(true);
            ok = false;
        } else {
            setErroDescricao(false);
        }
    
        msgRef.current.className = '';
        msgRef.current.innerHTML = '';
    
        if (ok) {
            let protocolo = {
                protTitulo: titulo.current.value,
                protTipo: tipo.current.value,
                protData: data.current.value,
                protDescricao: descricao.current.value,
                usuario: usuario,
                empresa: empresa
            };
    
            fetch('http://localhost:5000/protocolo', {
                mode: 'cors',
                credentials: 'include',
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                },
                body: JSON.stringify(protocolo)
            })
            .then(response => {
                if (response.status === 201) {
                    return response.json(); // Processa a resposta como JSON
                } else {
                    throw new Error('Erro ao cadastrar protocolo');
                }
            })
            .then(data => {
                const protId = data.result;
                if (protId) {
                  
                    const formData = new FormData();
                    formData.append("protocolo", protId); 
                    
                    arquivos.forEach((arquivo) =>{
                        formData.append("inputImage", arquivo);
                    })
            
                    return fetch('http://localhost:5000/docsProtocolo', {
                        mode: 'cors',
                        credentials: 'include',
                        method: "POST",
                        body: formData
                    })
                } else {
                    throw new Error('ID do protocolo não encontrado');
                }
            })
            .then(res => {
                if (!res.ok) {
                    msgRef.current.className = "msgError";
                    msgRef.current.innerHTML = res.msg;
                }
                return res.json();
            })
            .then(response => {
                if (response) {
                    router.push("/admin/protocolo");
                } else {
                    msgRef.current.className = "msgError";
                    msgRef.current.innerHTML = response.msg;
                }
            })
            .catch(error => {
                console.error(error.message);
            });
        } else {
            msgRef.current.className = "msgError";
            msgRef.current.innerHTML = "Preencha todos os campos";
        }
    }

    function alterarProtocolo(id) {
        let ok = true;
    
        if (titulo.current.value === "") {
            setErroTitulo(true);
            ok = false;
        } else {
            setErroTitulo(false);
        }
    
        if (tipo.current.value === "") {
            setErroTipo(true);
            ok = false;
        } else {
            setErroTipo(false);
        }
    
        if (data.current.value === "") {
            setErroData(true);
            ok = false;
        } else {
            setErroData(false);
        }
    
        if (descricao.current.value === "") {
            setErroDescricao(true);
            ok = false;
        } else {
            setErroDescricao(false);
        }
    
        msgRef.current.className = '';
        msgRef.current.innerHTML = '';
    
        if (ok) {
            let protocolo = {
                protId: id,
                protTitulo: titulo.current.value,
                protTipo: tipo.current.value,
                protData: data.current.value,
                protDescricao: descricao.current.value,
                usuario: usuario,
                empresa: empresa
            };
    
            fetch('http://localhost:5000/protocolo', {
                mode: 'cors',
                credentials: 'include',
                method: "PUT",
                headers: {
                    "Content-type": "application/json",
                },
                body: JSON.stringify(protocolo)
            })
            .then(response => {
                if (response.status === 201) {
                    return response.json(); // Processa a resposta como JSON
                } else {
                    throw new Error('Erro ao cadastrar protocolo');
                }
            })
            .then(r => {
                if(r.result){
                    const protId = id;
                    if (protId) {
    
                        const formData = new FormData();
                        formData.append("protocolo", protId); 
                        
                        arquivos.forEach((arquivo) =>{
                            formData.append("inputImage", arquivo);
                        })
                
                        return fetch('http://localhost:5000/docsProtocolo', {
                            mode: 'cors',
                            credentials: 'include',
                            method: "PUT",
                            body: formData
                        })
                    } else {
                        throw new Error('ID do protocolo não encontrado');
                    }
                } 
            })
            .then(res => {
                if (!res.ok) {
                    msgRef.current.className = "msgError";
                    msgRef.current.innerHTML = res.msg;
                }
                return res.json();
            })
            .then(response => {
                if (response) {
                    router.push("/admin/protocolo");
                } else {
                    msgRef.current.className = "msgError";
                    msgRef.current.innerHTML = response.msg;
                }
            })
            .catch(error => {
                console.error(error.message);
            });
        } else {
            msgRef.current.className = "msgError";
            msgRef.current.innerHTML = "Preencha todos os campos";
        }
    }
    
    const getCurrentDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    useEffect(() => {
        const currentDate = getCurrentDate();
        
        // Verifica se os refs estão prontos antes de usar
        if (data.current) {
            data.current.max = currentDate;

            const preventTyping = (e) => e.preventDefault();

            data.current.addEventListener('keydown', preventTyping);

            // Limpa os event listeners apenas se os elementos existirem
            return () => {
                if (data.current) {
                    data.current.removeEventListener('keydown', preventTyping);
                }
            };
        }
    }, []);

    console.log(docsProtocolo)

    return (
        <div className="container mt-1 d-flex justify-content-center">
            <div className="card mt-5 p-4 shadow" style={{ width: '800px' }}>
                <div ref={msgRef}></div>
                <h2 className="mb-4">{isAlteracao ? "Alterar Protocolo" : "Cadastrar Protocolo"}</h2>
                <p className="text-muted mb-4">Campos com * são obrigatórios</p>

                <div className="row">
                    <div className="col-md-5 form-group mb-3">
                        <label htmlFor="nome">Título*</label>
                        <input
                            defaultValue={protocolo.protTitulo}
                            ref={titulo}
                            type="text"
                            className={`form-control ${erroTitulo ? 'is-invalid' : ''}`}
                            onChange={() => setErroTitulo(false)}
                            placeholder="Digite o Título"
                        />
                    </div>

                    <div className="col-md-5 form-group mb-3">
                        <label htmlFor="status">Tipo*</label>
                        <select
                            defaultValue={protocolo.protTipo}
                            ref={tipo}
                            className={`form-control ${erroTipo ? 'is-invalid' : ''}`}
                            onChange={() => setErroTipo(false)}
                        >
                            <option value="">Selecione o tipo</option>
                            <option value="Entregue">Entregue</option>
                            <option value="Recebido">Recebido</option>
                        </select>
                    </div>
                </div>

                <div className="col-md-3 form-group mb-3">
                    <label htmlFor="data">Data*</label>
                    <input
                        defaultValue={protocolo.protData ? protocolo.protData.slice(0, 10) : ""}
                        ref={data}
                        type="date"
                        className={`form-control ${erroData ? 'is-invalid' : ''}`}
                        onChange={() => setErroData(false)}
                    />
                </div>

                <div className="form-group mb-3">
                    <label htmlFor="descricao">Descrição*</label>
                    <input
                        defaultValue={protocolo.protDescricao}
                        ref={descricao}
                        type="textarea"
                        className={`form-control ${erroDescricao ? 'is-invalid' : ''}`}
                        onChange={() => setErroDescricao(false)}
                        maxLength="100"
                    />
                    {erroDescricao && <small className="text-danger"> Ex: quem recebeu, quem entregou</small>}
                </div>

                <div className="col-md-7 form-group mb-3">
                    <label htmlFor="fileInput">Escolha um arquivo:</label>
                    <input
                        type="file"
                        id="fileInput"
                        name="arquivo"
                        onChange={handleFileChange}
                        multiple
                    />
                </div>

                <div className="file-grid">
                    {arquivos.length > 0 && (
                        <div className="row">
                            {arquivos.map((file, index) => (
                                <div key={index} className="file-item col-md-4">
                                    <div className="file-preview d-flex align-items-center justify-content-between">
                                        <p className="m-0 text-truncate">{file.name}</p>
                                        <button
                                            type="button"
                                            onClick={() => removerArquivo(index)}
                                            className="btn btn-link text-danger"
                                        >
                                            X
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {arquivoAlterado.docsEncontrados && arquivoAlterado.docsEncontrados.length > 0 && (
                    <div className="row mt-3">
                        {arquivoAlterado.docsEncontrados.map((doc, index) => (
                        <div key={index} className="file-item col-md-4">
                            <div className="file-preview d-flex align-items-center justify-content-between">
                            <p className="m-0 text-truncate">{doc.protDocsNome}</p>
                            <button
                                type="button"
                                onClick={() => removerArquivoAlterado(doc.protDocsId)}
                                className="btn btn-link text-danger"
                            >
                                X
                            </button>
                            </div>
                        </div>
                        ))}
                    </div>
                    )}
                </div>

                <div className="d-flex justify-content-between mt-4">
                    <button
                        onClick={() => (isAlteracao ? alterarProtocolo(protocolo.protId) : gravarProtocolo())}
                        className="btn btn-primary"
                    >
                        {isAlteracao ? "Alterar" : "Cadastrar"}
                    </button>
                    <Link href="/admin/protocolo" className="btn btn-outline-secondary">Voltar</Link>
                </div>
            </div>
        </div>
    );
}