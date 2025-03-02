export type TokenType = 'header' | 'listitem' | 'text' | 'bold' | 'italic' | 'link' | 'list';
export type Token<T extends 'root' | TokenType> = {
  type: T;
  meta?: T extends 'link' ? string : number;
  children: T extends 'list' ? Token<'listitem' | 'list'>[] : (Token<TokenType> | string)[];
  parent: T extends 'root' ? undefined : T extends 'listitem' ? Token<'list'> : Token<'root' | TokenType>;
};

export function parseByToken(content: string) {
  const tree: Token<'root'> = { type: 'root', children: [], parent: undefined };
  const lines = content.split('\n');
  let listToken: Token<'list'>;
  for (let line of lines) {
    const headermatch = line.match(/^(#{1,6}) /);
    const listMatch = line.match(/^(  *|\t*)- /);
    if (headermatch) {
      listToken = undefined;
      const token: Token<'header'> = { type: 'header', meta: headermatch[1]!.length, children: [], parent: tree };
      line = line.slice(headermatch[0].length);
      token.children.push(...parseLine(line, token));
      tree.children.push(token);
    } else if (listMatch) {
      const depth = listMatch[1]!.replaceAll('  ', '\t').length;
      if (!listToken) {
        listToken = { type: 'list', meta: depth, children: [], parent: tree };
        tree.children.push(listToken);
      } else if (depth > listToken.meta) {
        const newListToken: Token<'list'> = { type: 'list', meta: depth, children: [], parent: listToken };
        listToken.children.push(newListToken);
        listToken = newListToken;
      } else if (depth < listToken.meta) {
        while (listToken.parent.type === 'list' && depth < listToken.meta) {
          listToken = listToken.parent as Token<'list'>;
        }
        if (listToken.meta > depth) {
          listToken = { type: 'list', meta: depth, children: [], parent: tree };
          tree.children.push(listToken);
        }
      }
      const token: Token<'listitem'> = { type: 'listitem', children: [], parent: listToken };
      line = line.slice(listMatch[0].length);
      token.children.push(...parseLine(line, token));
      listToken.children.push(token);
    } else {
      listToken = undefined;
      const token: Token<'text'> = { type: 'text', children: [], parent: tree };
      tree.children.push(token);
      token.children.push(...parseLine(line, token));
    }
  }
  return tree;
}

function parseLine(content: string, token: Token<TokenType>): Token<TokenType>['children'] {
  const subTokens: (string | Token<'link' | 'bold' | 'italic'>)[] = [];
  const tokenpattern = /\*{1,3}|\[/;
  while (content) {
    const match = tokenpattern.exec(content);
    if (!match) {
      subTokens.push(content);
      break;
    }
    if (match.index > 0) {
      subTokens.push(content.slice(0, match.index));
      content = content.slice(match.index);
    }
    if (match[0].startsWith('***')) {
      const endToken = /\*{3,}/.exec(content.slice(3));
      if (endToken && endToken.index > 0) {
        const contained = content.slice(1, endToken.index + endToken[0].length + 2);
        const italicToken: Token<'italic'> = { type: 'italic', children: [], parent: token };
        italicToken.children.push(...parseLine(contained, italicToken));
        content = content.slice(2 + contained.length);
        subTokens.push(italicToken);
        continue;
      }
    }
    if (match[0].startsWith('**')) {
      const endToken = /\*{2,}/.exec(content.slice(2));
      if (endToken && endToken.index > 0) {
        const contained = content.slice(2, endToken.index + endToken[0].length);
        const boldToken: Token<'bold'> = { type: 'bold', children: [], parent: token };
        boldToken.children.push(...parseLine(contained, boldToken));
        content = content.slice(2 + endToken.index + endToken[0].length);
        subTokens.push(boldToken);
        continue;
      }
    }
    if (match[0].startsWith('*')) {
      const endToken = /\*/.exec(content.slice(1));
      if (endToken) {
        const contained = content.slice(1, endToken.index + 1);
        const italicToken: Token<'italic'> = { type: 'italic', children: [], parent: token };
        italicToken.children.push(...parseLine(contained, italicToken));
        content = content.slice(2 + endToken.index);
        subTokens.push(italicToken);
        continue;
      }
      content = content.slice(match[0].length);
      subTokens.push(match[0]);
      continue;
    }
    const link = /\[(?<text>[^\]]+)\]\((?<href>[^)]+)\)/.exec(content);
    if (!link) {
      subTokens.push('[');
      content = content.slice(1);
      continue;
    }
    const { text, href } = link.groups ?? {};
    const linkToken: Token<'link'> = { type: 'link', children: [], meta: href, parent: token };
    linkToken.children.push(...parseLine(text, linkToken));
    subTokens.push(linkToken);
    content = content.slice(link[0].length);
  }
  return subTokens;
}
