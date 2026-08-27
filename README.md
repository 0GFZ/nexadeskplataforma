# PARTE TEORICA - NEXADESK
## DevOps Fundamentals and Automation

---

## 1. DIAGNOSTICO TECNICO E CULTURAL COM BASE NO MODELO CALMS

A **NexaDesk** e uma empresa brasileira de SaaS B2B que cresceu rapido e hoje atende **250 clientes**. Nos ultimos 30 dias, o time enfrentou atrasos, instabilidade e falta de visibilidade. Usando o modelo **CALMS**, o diagnostico fica claro:

### **C - Cultura (Cultura Organizacional)**
O time vive em silos. Desenvolvedores e operacao nao conversam bem. Existe um "plantao informal", onde devs ficam responsaveis por deploy e correcoes sem processo claro. Isso gera atrito, estresse e culpa. A cultura atual e reativa, nao colaborativa. O projeto entregue muda isso ao centralizar tudo em um unico repositorio GitHub **0GFZ/nexadeskplataforma** com **8 arquivos padronizados**, onde qualquer pessoa do time consegue entender o sistema inteiro.

### **A - Automacao (Automacao de Processos)**
O deploy era manual. Uma mudanca levava de **7 a 12 dias** para ir do merge ate a producao porque dependia de "janelas" e checklists em planilhas. Nao existia pipeline automatizado. A solucao implementada usa **GitHub Actions** (**ci-cd.yml**) para automatizar o build e push da imagem Docker para o GHCR. O **Dockerfile** tem apenas **5 linhas** e usa **node:20-alpine**, garantindo leveza e reproducibilidade.

### **L - Lean (Eliminacao de Desperdicio)**
O processo anterior tinha muito desperdicio. Esperar dias para deployar, usar planilhas para controlar releases e fazer rollback manual eram atividades que nao agregavam valor ao cliente. A nova arquitetura e lean porque usa apenas **8 arquivos**: `src/app.js`, `Dockerfile`, `ci-cd.yml`, `observabilidade.yaml`, `deploy.yaml` (staging), `deploy.yaml` (prod), `README.md` e `RUNBOOK.md`. Nao ha Terraform, ArgoCD, Flux, OpenTelemetry ou scripts `.sh` desnecessarios. Tudo e declarativo e direto.

### **M - Mensuracao (Metricas e Observabilidade)**
A empresa nao media o que importava. Nao existiam metricas de desempenho de entrega (**DORA**) nem indicadores de confiabilidade (**SLI/SLO**). A solucao implementada inclui **Prometheus e Grafana** provisionados automaticamente via Kubernetes (**observabilidade.yaml**). O dashboard "NexaDesk - Brasil (UTC-3)" mostra em tempo real: **API online (ON/OFF), Requisicoes e Erros**. A timezone usada e **America/Fortaleza**, conforme exigido. O refresh e de **5 segundos**.

### **S - Sharing (Compartilhamento de Conhecimento)**
O conhecimento estava preso em poucas pessoas. Nao existia documentacao padronizada nem runbook para incidentes. A solucao inclui um **README.md** explicando a arquitetura e um **RUNBOOK.md** com comandos para troubleshooting. Qualquer pessoa do time consegue rodar o projeto localmente com **minikube start** (Docker driver, 2 CPUs, 2500MB) e aplicar os manifests com **kubectl apply**.

> **Conclusao do diagnostico:** a NexaDesk precisava de uma transformacao DevOps que unisse cultura, automacao, lean, metricas e compartilhamento em um fluxo unico. O projeto entregue resolve isso com uma arquitetura simples, visivel e totalmente automatizada.

---

## 2. CONCEITOS DE CI/CD, GITOPS E SRE APLICADOS AO PROJETO

### **CI/CD (Integracao Continua / Entrega Continua)**
CI/CD e a pratica de automatizar o caminho do codigo desde o commit ate a producao. No projeto NexaDesk, isso e feito pelo arquivo **.github/workflows/ci-cd.yml**. Quando um desenvolvedor faz merge na branch **develop**, o pipeline gera a imagem com tag **staging** e publica no GHCR. Quando o merge e na **main**, a tag e **v1.0.0** (producao). Isso elimina o deploy manual de 7 a 12 dias e garante que todo codigo passa pelo mesmo processo de build antes de ir para o ambiente.

### **GitOps (Git como Fonte da Verdade)**
GitOps e o modelo onde o Git se torna a "fonte da verdade". No projeto NexaDesk, tudo esta versionado no repositorio **0GFZ/nexadeskplataforma**. Os manifestos Kubernetes (`deploy.yaml` para staging e prod, `observabilidade.yaml` para monitoramento) declaram o estado desejado do sistema. O time aplica esses arquivos com **kubectl apply** e o cluster assume aquele estado. Se algo der errado, basta reverter o commit no Git e reaplicar. Nao ha planilhas, nao ha configuracao manual no servidor.

### **SRE (Site Reliability Engineering)**
SRE aplica engenharia de software para resolver problemas de operacao. No projeto NexaDesk, isso aparece em:

- **Probes:** a API tem **readinessProbe** e **livenessProbe** no endpoint `/health`, garantindo que o Kubernetes so envie trafego para pods saudaveis.
- **RollingUpdate:** os deployments usam strategy RollingUpdate com **maxUnavailable: 0** e **maxSurge: 1**, garantindo zero downtime.
- **Namespaces separados:** staging roda em **nexadesk-staging** e producao em **nexadesk-prod**, isolando os ambientes.
- **Replicas:** producao roda 3 replicas de API, 2 de frontend e 1 worker; staging roda 1 de cada, otimizando recursos do Minikube.
- **Runbook:** o **RUNBOOK.md** documenta comandos como `kubectl get pods`, `kubectl logs`, `kubectl port-forward` e como simular erros com `curl`.

---

## 3. SLIs, SLOs, ERROR BUDGET E METRICAS DORA

### **SLI (Service Level Indicator)**
SLI e o indicador que mede o nivel de servico. No projeto NexaDesk, os SLIs sao coletados pelo Prometheus a partir do endpoint `/metrics` da aplicacao:

- **`up{job="nexadesk-api"}`**: indica se a API esta respondendo (1) ou nao (0).
- **`http_requests_total{job="nexadesk-api"}`**: conta o total de requisicoes.
- **`http_errors_total{job="nexadesk-api"}`**: conta o total de erros (ex: chamadas ao endpoint `/error`).

### **SLO (Service Level Objective)**
SLO e a meta que o time se compromete a atingir. Exemplo para a NexaDesk:

- A API deve estar online (up=1) **99,9%** do tempo no mes.
- **99%** das requisicoes devem ser bem-sucedidas (sem erro 500).
- O endpoint `/health` deve responder em menos de 100ms em 95% das chamadas.

Se o SLO nao for atingido, o time para de fazer novas features e investe em estabilidade.

### **Error Budget (Orcamento de Erro)**
Error budget e a margem de erro aceitavel. Se o SLO e **99,9% de disponibilidade**, o error budget e **0,1%** de inatividade no mes. No projeto, se o dashboard Grafana mostrar muitos erros (`http_errors_total` crescendo), o time sabe que esta gastando o error budget e deve parar de deployar novas features ate estabilizar. O error budget transforma a discussao de "quem tem culpa" em "o que os dados dizem".

### **Metricas DORA**
DORA define **4 metricas essenciais**. No projeto NexaDesk, elas se refletem assim:

#### **1. Lead Time for Changes (Tempo de Entrega)**
E o tempo entre o commit e o deploy em producao.
- **Antes:** 7 a 12 dias.
- **Com CI/CD:** minutos ou horas, pois o pipeline builda e publica a imagem automaticamente.

#### **2. Deployment Frequency (Frequencia de Deploy)**
E quantas vezes o time deploya.
- **Antes:** poucas vezes por mes, com medo.
- **Com GitOps e Kubernetes:** varias vezes por dia ou semana, porque deploys sao feitos com `kubectl apply` e rollback e rapido.

#### **3. Mean Time To Recover (MTTR)**
E o tempo para recuperar de uma falha.
- **Antes:** rollback manual demorado.
- **Com o projeto:** minutos. Se um pod falhar, o Kubernetes recria automaticamente. Se uma versao nova apresentar erro, basta voltar a imagem anterior no `deploy.yaml` e aplicar.

#### **4. Change Failure Rate (Taxa de Falha de Mudanca)**
E a porcentagem de deploys que causam incidentes.
- **Antes:** alta, com 3 incidentes em 30 dias.
- **Com probes, rolling update e observabilidade:** a taxa cai porque problemas sao detectados antes do cliente perceber. O endpoint `/error` permite simular falhas e ver no Grafana se o sistema detecta corretamente.

---

## CONCLUSAO

O projeto NexaDesk demonstra na pratica como **CALMS**, **CI/CD**, **GitOps**, **SRE**, **SLI/SLO**, **error budget** e **DORA** se conectam. Com apenas **8 arquivos**, uma imagem Docker unica (modo API, worker e frontend controlado pela variavel `MODE`), pipeline GitHub Actions, manifests Kubernetes enxutos e Grafana com dashboard auto-provisionado, a NexaDesk tem um caminho claro para reduzir lead time, aumentar confiabilidade e eliminar trabalho operacional manual em 60 dias.
