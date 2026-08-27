# NEXADESK - README E RUNBOOK
## Instrucoes de execucao e resposta a incidentes

---

## OS 8 ARQUIVOS DO PROJETO

O projeto tem apenas 8 arquivos. E simples assim:

| Arquivo | Descricao |
|---------|-----------|
| `src/app.js` | Aplicacao Node.js unica. Muda de comportamento conforme a variavel `MODE` (api, worker, frontend). |
| `Dockerfile` | 5 linhas. Usa `node:20-alpine` para criar a imagem Docker leve. |
| `.github/workflows/ci-cd.yml` | Pipeline GitHub Actions. Builda a imagem e publica no GHCR automaticamente. |
| `k8s/observabilidade.yaml` | Prometheus + Grafana com dashboard auto-provisionado. |
| `environments/staging/deploy.yaml` | Manifesto Kubernetes do ambiente de testes (staging). |
| `environments/prod/deploy.yaml` | Manifesto Kubernetes do ambiente de producao (prod). |
| `README.md` | Este documento. Explica a arquitetura e como rodar. |
| `RUNBOOK.md` | Checklist de deploy e comandos para incidentes. |

---

## COMO RODAR NO MINIKUBE

Siga esses passos na ordem:

1. **Ligue o Minikube:**
   ```bash
   minikube start --driver=docker --cpus=2 --memory=2500
   ```

2. **Buildar a imagem:**
   ```bash
   docker build -t nexadesk/app:staging .
   ```

3. **Carregar no Minikube:**
   ```bash
   minikube image load nexadesk/app:staging
   ```

4. **Aplicar staging:**
   ```bash
   kubectl apply -f environments/staging/deploy.yaml
   ```

5. **Aplicar prod:**
   ```bash
   kubectl apply -f environments/prod/deploy.yaml
   ```

6. **Aplicar monitoramento:**
   ```bash
   kubectl apply -f k8s/observabilidade.yaml
   ```

7. **Ver os pods:**
   ```bash
   kubectl get pods --all-namespaces
   ```

8. **Ver o frontend:**
   ```bash
   kubectl port-forward svc/frontend 8080:80 -n nexadesk-staging
   ```
   Acesse: http://localhost:8080

9. **Ver o Grafana:**
   ```bash
   kubectl port-forward svc/grafana 3000:3000 -n monitoring
   ```
   Acesse: http://localhost:3000 (login: **admin/admin**)

---

## FLUXO DE DEPLOY (CI/CD)

O deploy funciona assim:

1. Dev faz commit e push para a branch `develop` ou `main`.
2. GitHub Actions (`ci-cd.yml`) detecta o push e inicia o pipeline.
3. O pipeline builda a imagem Docker usando o `Dockerfile`.
4. A imagem e enviada para o GHCR (GitHub Container Registry).
5. `develop` -> tag `staging` -> ambiente de testes
6. `main` -> tag `v1.0.0` -> ambiente de producao
7. No cluster Kubernetes, o `deploy.yaml` usa a imagem correspondente.
8. `kubectl apply` atualiza os pods sem parar o sistema (rolling update).

---

## CHECKLIST DE DEPLOY

- [ ] O codigo foi mergeado na branch correta (`develop` ou `main`)?
- [ ] O pipeline do GitHub Actions ficou verde (sem erro)?
- [ ] A imagem apareceu no GHCR com a tag certa (`staging` ou `v1.0.0`)?
- [ ] O arquivo `deploy.yaml` esta com a imagem correta?
- [ ] `kubectl apply` foi executado no ambiente certo?
- [ ] Todos os pods estao no estado `Running` (`kubectl get pods`)?
- [ ] O endpoint `/health` responde OK?
- [ ] O Grafana mostra **API: ON**?

---

## RESPOSTA A INCIDENTES

Se algo der errado, siga esta ordem:

### 1. Ver os pods
Veja se algum pod esta `CrashLoopBackOff` ou `Pending`.
```bash
kubectl get pods --all-namespaces
```

### 2. Ver os logs
Identifique a mensagem de erro.
```bash
kubectl logs -n nexadesk-staging deploy/api
```

### 3. Verificar saude
A API deve responder `{"status":"ok"}`.
```bash
curl http://localhost:3002/health
```

### 4. Ver o Grafana
Veja se API esta ON e se erros estao subindo.
```bash
kubectl port-forward svc/grafana 3000:3000 -n monitoring
```
Acesse: http://localhost:3000 (admin/admin)

### 5. Simular erro
Teste se o dashboard detecta o erro.
```bash
curl http://localhost:3002/error
```

### 6. Reiniciar um pod
Forca o Kubernetes a recriar o pod.
```bash
kubectl rollout restart deploy/api -n nexadesk-staging
```

### 7. Voltar versao
Rollback rapido para a versao anterior.
> Altere a tag da imagem no `deploy.yaml` e aplique de novo:
> ```bash
> kubectl apply -f environments/staging/deploy.yaml
> ```

---

## DICAS RAPIDAS

- **Staging** usa NodePort **30080**. **Producao** usa NodePort **30081**.
- Grafana ja vem com o dashboard "NexaDesk - Brasil (UTC-3)" carregado automaticamente.
- A timezone do dashboard e **America/Fortaleza** (UTC-3).
- Se o pod ficar em `ImagePullBackOff`, faca o `docker build` e `minikube image load` de novo.
- Nao e necessario Terraform, ArgoCD, Flux ou scripts `.sh`. Tudo e YAML puro.
