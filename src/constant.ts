// 2 id in novu subscriber
export const __test__ = false;

export const user2IdMap = __test__ ? {
    'leen1218': '66758d34c4e1f89f2645d53d',
    'burningdevil': '66758d34c4e1f89f2645d53d',
    'oliveshell': '66758d34c4e1f89f2645d53d',
} : {
    'leen1218': 'enliid',
    'En Li': 'enliid',
    'burningdevil': 'kaiwangid',
    'Kai Wang': 'kaiwangid',
    'oliveshell': 'xhcid',
    'Haocan Xu': 'xhcid',
    'lindu': 'linduid',
    'wjiang': 'weijiangid',
    'admin': '66758d34c4e1f89f2645d53d'
}

// 2 name in novu name, covert the content
export const user2NameMap = {
    'leen1218': 'En Li',
    'burningdevil': 'Kai Wang',
    'oliveshell': 'Haocan Xu',
}

export const convertNames = (content) => {
    for (const [key, value] of Object.entries(user2NameMap)) {
        content = content.replace(new RegExp(`${key}`, 'g'), `${value}`);
    }
    return content;
}