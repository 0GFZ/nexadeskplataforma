# NexaDesk Plataforma

Plataforma SaaS B2B da NexaDesk com API, Worker e Frontend rodando em Kubernetes.

## Arquitetura

Aplicacao Node.js unica que muda de comportamento conforme a variavel `MODE`:
- `MODE=api` -> API REST
- `MODE=worker` -> Worker em background
- `MODE=frontend` -> Frontend SPA

## Pré-requisitos

- Docker
- Minikube
- kubectl

## Como executar localmente

1. Iniciar o Minikube:
```bash
minikube start --driver=docker --cpus=2 --memory=2500
```

2. Buildar a imagem Docker:
```bash
docker build -t nexadesk/app:staging .
```

3. Carregar a imagem no Minikube:
```bash
minikube image load nexadesk/app:staging
```

4. Aplicar o ambiente de staging:
```bash
kubectl apply -f environments/staging/deploy.yaml
```

5. Aplicar o ambiente de producao:
```bash
kubectl apply -f environments/prod/deploy.yaml
```

6. Aplicar monitoramento (Prometheus + Grafana):
```bash
kubectl apply -f k8s/observabilidade.yaml
```

7. Verificar os pods:
```bash
kubectl get pods --all-namespaces
```

8. Acessar o frontend:
```bash
kubectl port-forward svc/frontend 8080:80 -n nexadesk-staging
```
Acesse: http://localhost:8080

9. Acessar o Grafana:
```bash
kubectl port-forward svc/grafana 3000:3000 -n monitoring
```
Acesse: http://localhost:3000 (login: admin / admin)

## Fluxo de Deploy (CI/CD)

1. Desenvolvedor faz commit e push para a branch `develop` ou `main`
2. GitHub Actions (`.github/workflows/ci-cd.yml`) detecta o push e inicia o pipeline
3. Pipeline builda a imagem Docker usando o `Dockerfile`
4. Imagem e enviada para o GHCR (GitHub Container Registry)
5. Branch `develop` gera tag `staging` para ambiente de testes
6. Branch `main` gera tag `v1.0.0` para ambiente de producao
7. Kubernetes aplica o `deploy.yaml` correspondente
8. Rolling update atualiza os pods sem downtime

## Estrutura do projeto

```
nexadeskplataforma/
├── src/app.js                    # Aplicacao Node.js (API/Worker/Frontend)
├── Dockerfile                    # Imagem Docker (node:20-alpine)
├── .github/workflows/ci-cd.yml   # Pipeline GitHub Actions
├── k8s/observabilidade.yaml      # Prometheus + Grafana
├── environments/
│   ├── staging/deploy.yaml       # Manifesto Staging
│   └── prod/deploy.yaml          # Manifesto Producao
├── README.md                     # Este arquivo
└── RUNBOOK.md                    # Checklist e resposta a incidentes
```

## Ambientes

| Ambiente | Namespace | NodePort |
|----------|-----------|----------|
| Staging | nexadesk-staging | 30080 |
| Producao | nexadesk-prod | 30081 |

## Tecnologias

- Node.js 20 (Alpine)
- Docker
- Kubernetes / Minikube
- GitHub Actions
- Prometheus
- Grafana
