"use strict";
function putUsersInShuffledGroups(commentUsers, trainer, groupSize) {
    const validUsers = commentUsers.filter(commenter => commenter);
    const uniqueUsers = new Set(validUsers);
    // check if odd count of commenters to know if the trainer should be added to a pair
    const oddCountOfUsers = (Array.from(uniqueUsers).length % 2) == 0;
    if (oddCountOfUsers && !uniqueUsers.has(trainer)) {
        uniqueUsers.add(trainer);
    }
    const usersToChunk = Array.from(uniqueUsers);
    const shuffledUsersToChunk = shuffle(usersToChunk);
    const userGroups = shuffledUsersToChunk.reduce((resultArray, item, index) => {
        const chunkIndex = Math.floor(index / groupSize);
        if (!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = new Set(); // start a new chunk
        }
        resultArray[chunkIndex].add(item);
        return resultArray;
    }, []);
    return userGroups;
}
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }
    return array;
}
module.exports = async (args) => {
    const { github, context } = args;
    const trainer = context.payload.sender?.login;
    var issue = context.issue;
    if (!issue.number) {
        issue.number = context.payload['inputs'].issue_number;
    }
    const commentUsers = await github.paginate(github.rest.issues.listComments, {
        owner: issue.owner,
        repo: issue.repo,
        issue_number: issue.number,
    }, (response) => response.data.map((issue) => issue.user?.login));
    const groupSize = 2; // we use pairs for now
    const userGroups = putUsersInShuffledGroups(commentUsers, trainer, groupSize);
    for (const userGroup of userGroups) {
        const usersAsListMarkdown = Array.from(userGroup).map(user => `- @${user}`).join('\n');
        await github.rest.issues.createComment({
            issue_number: issue.number,
            owner: issue.owner,
            repo: issue.repo,
            body: `These people will work together:\n${usersAsListMarkdown}`,
        });
    }
};
