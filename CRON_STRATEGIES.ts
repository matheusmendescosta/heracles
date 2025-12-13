/**
 * Exemplos de diferentes estratégias de renovação de tokens
 * Escolha a que melhor se adequa ao seu caso de uso
 */

// ============================================
// ESTRATÉGIA 1: RENOVAÇÃO AGRESSIVA (Recomendado para muitos usuários)
// ============================================
// A cada 15 minutos renova tokens que vão expirar em 10 minutos
// ✅ Garante que tokens nunca expirem
// ✅ Melhor para sistemas com muitos usuários simultâneos
// ❌ Mais chamadas à API OAuth

export const AGGRESSIVE_STRATEGY = {
  renovationSchedule: '*/15 * * * *', // A cada 15 minutos
  expirationThresholdMinutes: 10, // Renovar se expira em 10 min
  cleanupSchedule: '0 0 * * *', // Limpeza diária
};

// ============================================
// ESTRATÉGIA 2: RENOVAÇÃO PADRÃO (Configuração Atual)
// ============================================
// A cada hora renova tokens que vão expirar em 5 minutos
// ✅ Balanço entre segurança e performance
// ✅ Recomendado para maioria dos casos
// ✅ Menos chamadas à API

export const STANDARD_STRATEGY = {
  renovationSchedule: '0 * * * *', // A cada hora (CronExpression.EVERY_HOUR)
  expirationThresholdMinutes: 5, // Renovar se expira em 5 min
  cleanupSchedule: '0 */6 * * *', // A cada 6 horas
};

// ============================================
// ESTRATÉGIA 3: RENOVAÇÃO PREGUIÇOSA (Sob Demanda)
// ============================================
// Renova apenas quando solicitado antes de usar
// ✅ Menos carga no servidor
// ❌ Usuário pode ter latência em primeira requisição
// ❌ Requer TokenValidationHelper em todo serviço

export const LAZY_STRATEGY = {
  renovationSchedule: null, // Desabilitar Cron Job
  useTokenValidationHelper: true, // Usar TokenValidationHelper
  cleanupSchedule: '0 0 1 * *', // Limpeza mensal
};

// ============================================
// ESTRATÉGIA 4: RENOVAÇÃO CONSERVADORA (Para APIs com limites)
// ============================================
// A cada 6 horas renova tokens que vão expirar em 30 minutos
// ✅ Poucas chamadas à API
// ✅ Tokens têm margem de 30 minutos
// ❌ Risco de expiração se houver atraso

export const CONSERVATIVE_STRATEGY = {
  renovationSchedule: '0 */6 * * *', // A cada 6 horas
  expirationThresholdMinutes: 30, // Renovar se expira em 30 min
  cleanupSchedule: '0 0 1 * *', // Limpeza mensal
};

// ============================================
// ESTRATÉGIA 5: RENOVAÇÃO CUSTOMIZADA POR HORA
// ============================================
// Renovação em horários específicos (fora de pico)
// ✅ Melhor para distribuir carga
// ✅ Evita picos de requisições

export const CUSTOM_HOURS_STRATEGY = {
  // Renovar às 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
  renovationSchedule: '0 0,4,8,12,16,20 * * *',
  expirationThresholdMinutes: 120, // Margem de 2 horas
  cleanupSchedule: '0 2 * * *', // 02:00 todo dia
};

// ============================================
// COMO ALTERAR A ESTRATÉGIA
// ============================================
// 1. Abra: src/integrations/services/token-refresh.service.ts
// 2. Encontre: @Cron(CronExpression.EVERY_HOUR)
// 3. Substitua pela expressão Cron desejada
// 4. Se usar threshold diferente, ajuste no findExpiringTokens()

// ============================================
// EXPRESSÕES CRON COMUNS (Referência Rápida)
// ============================================

export const CRON_EXPRESSIONS = {
  // Predefinidas do NestJS
  EVERY_SECOND: '* * * * * *',
  EVERY_10_SECONDS: '*/10 * * * * *',
  EVERY_30_SECONDS: '*/30 * * * * *',
  EVERY_MINUTE: '* * * * *',
  EVERY_10_MINUTES: '*/10 * * * *',
  EVERY_30_MINUTES: '*/30 * * * *',
  EVERY_HOUR: '0 * * * *',

  // Customizadas
  A_CADA_15_MINUTOS: '*/15 * * * *',
  A_CADA_2_HORAS: '0 */2 * * *',
  A_CADA_6_HORAS: '0 */6 * * *',
  A_CADA_12_HORAS: '0 */12 * * *',
  DIARIAMENTE_00H: '0 0 * * *',
  DIARIAMENTE_02H: '0 2 * * *',
  DIARIAMENTE_09H: '0 9 * * *',
  SEGUNDA_A_SEXTA_09H: '0 9 * * 1-5',
  SABADO_DOMINGO_10H: '0 10 * * 0,6',
  PRIMEIRO_DIA_MES: '0 0 1 * *',
  ULTIMO_DIA_MES: '0 23 L * *',
  SEGUNDA_FEIRA_00H: '0 0 * * 1',
};

// ============================================
// MONITORAMENTO E LOGS
// ============================================
// O TokenRefreshService automaticamente loga:
// ✅ Início e fim de cada ciclo de renovação
// ✅ Quantidade de tokens renovados
// ✅ Sucesso/falha de cada renovação
// ✅ Erros ao desativar integrações
// ✅ Limpeza de dados obsoletos

// Ver logs:
// npm run start:dev
// Procure por: [TokenRefreshService]

// ============================================
// BENCHMARK: Tempo de Execução Esperado
// ============================================
// Com 100 usuários:
// - Renovação: ~5-10 segundos
// - Limpeza: ~2-5 segundos

// Com 1000 usuários:
// - Renovação: ~30-60 segundos
// - Limpeza: ~10-30 segundos

// Se Cron Job demorar muito, considere:
// 1. Usar estratégia LAZY com TokenValidationHelper
// 2. Reduzir frequência de limpeza
// 3. Aumentar threshold de expiração
