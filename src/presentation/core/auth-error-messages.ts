export function localizeAuthErrorMessage(message: string): string {
  const exact: Record<string, string> = {
    'E-mail já cadastrado': 'Este e-mail já está cadastrado.',
    'CPF já cadastrado': 'Este CPF já está cadastrado.',
    'CPF inválido': 'CPF inválido.',
    'Email already registered': 'Este e-mail já está cadastrado.',
    'Seu cadastro foi recebido. Aguarde a liberação do acesso para entrar no app.':
      'Seu cadastro foi recebido. Aguarde a liberação do acesso para entrar no app.',
  };
  return exact[message.trim()] ?? message;
}
