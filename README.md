# NexaDesk — DevOps simples

## Arquitetura

`Git → GitHub Actions → imagem no GHCR → staging → aprovação → produção`

No Kubernetes existem três deployments usando a mesma imagem:
- **API Node.js**: saúde, métricas e acesso ao banco externo por Secret.
- **Worker Node.js**: processamento assíncrono e logs JSON.
- **Frontend SPA**: página web simples.

Prometheus coleta métricas e Grafana carrega o dashboard automaticamente. Os YAMLs em `environments/staging` e `environments/prod` são a fonte da verdade do GitOps. Em produção, o Argo CD pode substituir o `kubectl apply` para reconciliação automática.

## Executar localmente

```bash
minikube start --driver=docker --memory=2500 --cpus=2
docker build -t nexadesk/app:staging .
minikube image load nexadesk/app:staging
kubectl apply -f environments/staging/deploy.yaml
kubectl apply -f k8s/observability.yaml
kubectl wait --for=condition=Ready pod --all -A --timeout=180s
kubectl get pods -A
```

Grafana, em outro terminal:

```bash
kubectl port-forward -n monitoring svc/grafana 3000:3000
```

Acesse `http://localhost:3000` com `admin / admin`. O dashboard aparece automaticamente em horário do Brasil (UTC-3, `America/Fortaleza`).

Frontend, em outro terminal:

```bash
kubectl port-forward -n nexadesk-staging svc/frontend 8080:80
```

Acesse `http://localhost:8080`.

## Fluxo de deploy

1. Feature branch e Pull Request com revisão.
2. Merge em `develop`: teste, build, artefato e promoção para staging.
3. Validação das probes e dashboard.
4. Merge em `main`: aprovação do environment `production` e promoção.
5. Falha: `kubectl rollout undo deployment/api -n nexadesk-prod`.

## SRE e DORA

- **SLIs:** disponibilidade (`up`), requisições e erros.
- **SLO:** disponibilidade mensal de 99,9% e erros abaixo de 1%.
- **Error budget:** 0,1%; se acabar, pausar releases e corrigir confiabilidade.
- **DORA:** frequência de deploy, lead time, taxa de falha e tempo de recuperação.

## Decisões e trade-offs

A solução usa YAML puro para ficar curta. Helm, Terraform, Loki e OpenTelemetry ficam para a segunda fase. O banco permanece fora do cluster e sua senha deve vir de um gerenciador de secrets em produção.

## Referências primárias

- DORA — Software Delivery Performance Metrics
- Google — Site Reliability Engineering Book
- GitHub Actions — Deployments e Environments
- Kubernetes — Deployments, probes e rollback
- Prometheus e Grafana — documentação oficial
