export function localizeAuthErrorMessage(message: string): string {
  const exact: Record<string, string> = {
    'E-mail já cadastrado': 'Este e-mail já está cadastrado.',
    'CPF já cadastrado': 'Este CPF já está cadastrado.',
    'CPF inválido': 'CPF inválido.',
    'Email already registered': 'Este e-mail já está cadastrado.',
    'Seu cadastro foi recebido. Aguarde a liberação do acesso para entrar no app.':
      'Seu cadastro foi recebido. Aguarde a liberação do acesso para entrar no app.',
    'Sua solicitação de acesso ao Nutri+ não foi aprovada neste momento. Verifique o e-mail que enviamos com mais detalhes.':
      'Sua solicitação de acesso ao Nutri+ não foi aprovada neste momento. Verifique o e-mail que enviamos com mais detalhes.',
  };
  return exact[message.trim()] ?? message;
}
