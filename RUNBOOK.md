# Runbook técnico — NexaDesk

## Checklist antes do deploy

- [ ] Pull Request revisado e testes aprovados.
- [ ] Imagem identificada pelo SHA do commit.
- [ ] Secret do banco configurado no ambiente.
- [ ] Error budget disponível.
- [ ] Responsável pelo deploy definido.

## Validação após o deploy

```bash
kubectl rollout status deployment/api -n nexadesk-prod
kubectl get pods -n nexadesk-prod
kubectl logs deployment/api -n nexadesk-prod --tail=50
```

Confirmar no Grafana: API online, requisições e erros. Testar `/health` e o frontend.

## Incidente: API indisponível ou erro alto

1. Confirmar impacto e horário no Grafana.
2. Ver eventos e logs:

```bash
kubectl get events -n nexadesk-prod --sort-by=.lastTimestamp
kubectl logs deployment/api -n nexadesk-prod --tail=100
```

3. Se começou após o deploy, fazer rollback imediato:

```bash
kubectl rollout undo deployment/api -n nexadesk-prod
kubectl rollout status deployment/api -n nexadesk-prod
```

4. Se o Worker falhar:

```bash
kubectl logs deployment/worker -n nexadesk-prod --tail=100
kubectl rollout restart deployment/worker -n nexadesk-prod
```

5. Comunicar PO e clientes críticos. Registrar causa, duração, impacto e ação preventiva.
6. Se o error budget acabar, bloquear novos releases, exceto correções urgentes.

## Evidências DORA

Registrar por deploy: commit, início/fim do pipeline, sucesso/falha, rollback e tempo de recuperação. Revisar semanalmente durante os 60 dias.
