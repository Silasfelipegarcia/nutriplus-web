import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MarketingHeaderComponent } from '../marketing-header/marketing-header.component';
import { MarketingFooterComponent } from '../marketing-footer/marketing-footer.component';
import { CookieBannerComponent } from '../cookie-banner/cookie-banner.component';
import { TERMS_BODY } from '../../core/constants';

interface LegalContent {
  title: string;
  sections: { heading: string; paragraphs: string[] }[];
}

const LEGAL_PAGES: Record<string, LegalContent> = {
  privacidade: {
    title: 'Política de Privacidade',
    sections: [
      {
        heading: 'Coleta de dados',
        paragraphs: [
          'Coletamos dados de cadastro (nome, e-mail), perfil nutricional, medições corporais e registros de aderência alimentar para fornecer o serviço NutriPlus.',
        ],
      },
      {
        heading: 'Uso dos dados',
        paragraphs: [
          'Seus dados são utilizados exclusivamente para personalizar planos alimentares, calcular macros, gerar relatórios de progresso e melhorar sua experiência no aplicativo.',
          'Não vendemos seus dados pessoais a terceiros.',
        ],
      },
      {
        heading: 'Seus direitos (LGPD)',
        paragraphs: [
          'Você pode solicitar acesso, correção ou exclusão dos seus dados entrando em contato pelo e-mail contato@nutriplus.com.br.',
          'O tratamento é baseado na execução do contrato de serviço e no seu consentimento para termos e política de privacidade.',
        ],
      },
      {
        heading: 'Retenção',
        paragraphs: [
          'Mantemos seus dados enquanto sua conta estiver ativa. Após exclusão da conta, os dados são removidos em até 30 dias, salvo obrigações legais.',
        ],
      },
    ],
  },
  termos: {
    title: 'Termos de Uso',
    sections: [
      {
        heading: 'Aceite',
        paragraphs: [
          'Ao utilizar o NutriPlus, você concorda com estes termos e com nossa política de privacidade.',
        ],
      },
      {
        heading: 'Uso de inteligência artificial',
        paragraphs: [TERMS_BODY],
      },
      {
        heading: 'Responsabilidades',
        paragraphs: [
          'Você é responsável pela veracidade das informações fornecidas e por manter suas credenciais seguras.',
          'O NutriPlus não se responsabiliza por decisões de saúde tomadas exclusivamente com base nas sugestões automatizadas.',
        ],
      },
    ],
  },
  cookies: {
    title: 'Política de Cookies',
    sections: [
      {
        heading: 'O que são cookies',
        paragraphs: [
          'Cookies são pequenos arquivos armazenados no seu navegador para lembrar preferências e melhorar a experiência.',
        ],
      },
      {
        heading: 'Cookies que utilizamos',
        paragraphs: [
          'Essenciais: sessão de autenticação e preferências de consentimento.',
          'Analíticos (opcionais): métricas de uso anônimas, apenas com seu consentimento.',
        ],
      },
      {
        heading: 'Como gerenciar',
        paragraphs: [
          'Você pode recusar cookies analíticos no banner de consentimento ou limpar cookies nas configurações do navegador.',
        ],
      },
    ],
  },
  seguranca: {
    title: 'Segurança',
    sections: [
      {
        heading: 'Autenticação',
        paragraphs: [
          'Utilizamos JWT (JSON Web Tokens) com tokens de acesso de curta duração e refresh tokens para renovação segura.',
          'Senhas são armazenadas com hash BCrypt — nunca em texto puro.',
        ],
      },
      {
        heading: 'Proteção de API',
        paragraphs: [
          'Rate limiting em endpoints de autenticação para prevenir abuso.',
          'CORS restrito a origens autorizadas em produção.',
          'Headers de rastreamento (correlation ID) para auditoria e diagnóstico.',
        ],
      },
      {
        heading: 'Infraestrutura',
        paragraphs: [
          'Comunicação criptografada via HTTPS/TLS.',
          'Agentes de IA executam em rede interna — não expostos diretamente ao cliente.',
          'Varreduras de segurança automatizadas no pipeline de CI (CodeQL, Trivy).',
        ],
      },
    ],
  },
};

@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [MarketingHeaderComponent, MarketingFooterComponent, CookieBannerComponent],
  template: `
    <div class="legal-page">
      <app-marketing-header />
      <main class="container legal-page__content">
        @if (content) {
          <h1>{{ content.title }}</h1>
          <p class="legal-page__updated">Última atualização: junho de 2026</p>
          @for (section of content.sections; track section.heading) {
            <h2>{{ section.heading }}</h2>
            @for (p of section.paragraphs; track p) {
              <p>{{ p }}</p>
            }
          }
        }
      </main>
      <app-marketing-footer />
      <app-cookie-banner />
    </div>
  `,
  styleUrl: './legal-page.component.scss',
})
export class LegalPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly content = LEGAL_PAGES[this.route.snapshot.data['legalKey'] as string];
}
