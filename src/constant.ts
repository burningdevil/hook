// 2 id in novu subscriber
export const user2IdMap = {
    'leen1218': '66758d34c4e1f89f2645d53d',
    'burningdevil': '66758d34c4e1f89f2645d53d',
    'haocan': '66758d34c4e1f89f2645d53d',
}

export const user2IdMap2 = {
    'leen1218': 'enliid',
    'burningdevil': 'kaiwangid',
    'haocan': 'xhcid',
}

// 2 name in novu name, covert the content
export const user2NameMap = {
    'leen1218': 'en li',
    'burningdevil': 'kai wang',
    'haocan': 'haocan xu',
}

export const convertNames = (content) => {
    for (const [key, value] of Object.entries(user2NameMap)) {
        content = content.replace(new RegExp(`@${key}`, 'g'), `@${value}`);
    }
    return content;
}