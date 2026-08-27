# RUNBOOK - NexaDesk

Checklist de deploy e resposta rapida a incidentes.

---

## CHECKLIST DE DEPLOY

Antes de cada deploy, confirme:

- [ ] Codigo mergeado na branch `develop` (staging) ou `main` (producao)
- [ ] Pipeline GitHub Actions ficou verde
- [ ] Imagem apareceu no GHCR com a tag certa (`staging` ou `v1.0.0`)
- [ ] `deploy.yaml` esta com a imagem correta
- [ ] `kubectl apply` executado no ambiente certo
- [ ] Todos os pods no estado `Running`
- [ ] Endpoint `/health` responde `{"status":"ok"}`
- [ ] Grafana mostra **API: ON**

---

## COMANDOS UTEIS

Ver pods:
```bash
kubectl get pods --all-namespaces
```

Ver logs da API:
```bash
kubectl logs -n nexadesk-staging deploy/api
```

Verificar saude:
```bash
curl http://localhost:3002/health
```

Acessar Grafana:
```bash
kubectl port-forward svc/grafana 3000:3000 -n monitoring
```
Login: `admin` / `admin`

Acessar frontend:
```bash
kubectl port-forward svc/frontend 8080:80 -n nexadesk-staging
```

Reiniciar pods:
```bash
kubectl rollout restart deploy/api -n nexadesk-staging
```

---

## RESPOSTA A INCIDENTES

### API fora do ar (Grafana mostra API: OFF)

1. Ver pods:
```bash
kubectl get pods -n nexadesk-staging
```
2. Ver logs:
```bash
kubectl logs -n nexadesk-staging deploy/api
```
3. Testar /health:
```bash
curl http://localhost:3002/health
```
4. Se necessario, reiniciar:
```bash
kubectl rollout restart deploy/api -n nexadesk-staging
```

### Erros subindo no Grafana

1. Verificar logs:
```bash
kubectl logs -n nexadesk-staging deploy/api
```
2. Simular erro para testar:
```bash
curl http://localhost:3002/error
```
3. Verificar se o dashboard detectou o erro

### Rollback (voltar versao)

1. Editar `deploy.yaml` e mudar a tag da imagem para a versao anterior
2. Aplicar:
```bash
kubectl apply -f environments/staging/deploy.yaml
```

### Pod com ImagePullBackOff

1. Buildar e carregar a imagem de novo:
```bash
docker build -t nexadesk/app:staging .
minikube image load nexadesk/app:staging
```
2. Verificar pods:
```bash
kubectl get pods -n nexadesk-staging
```

---

## CONTATOS E REFERENCIAS

- Repositorio: `0GFZ/nexadeskplataforma`
- Ambiente Staging: `nexadesk-staging` (NodePort 30080)
- Ambiente Producao: `nexadesk-prod` (NodePort 30081)
- Grafana: http://localhost:3000
