const commentsBuilder = function (data, comments) {
    if (!comments) {
        comments = data.comments
    }
    let body = data.body
    if (!body) {
        return data
    }
    if (!Array.isArray(body)) {
        body = [body]
    }
    let start = data.start
    let end = start
    body.forEach(item => {
        end = item.start
        for (let i = 0; i < comments.length; i ++) {
            if (end < comments[i].start) {
                break;
            }
            if (comments[i].start >= start && comments[i].end <= end) {
                if (!item.leadingComments) {
                    item.leadingComments = []
                }
                item.leadingComments.push(comments[i])
                comments.splice(i, 1)
                i --
            }
        }
        item = commentsBuilder(item, comments)
        start = item.end
    })

    if (!Array.isArray(data.body)) {
        data.body = body.shift()
    } else {
        data.body = body
    }
    return data
}

module.exports = commentsBuilder
