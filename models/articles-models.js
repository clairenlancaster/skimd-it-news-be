const db = require("../db/connection.js");

fetchArticles = (topic, sort_by, order) => {
  const validTopicByOptions = ["mitch", "cats", "paper"];
  if (topic && !validTopicByOptions.includes(topic)) {
    return Promise.reject({
      status: 400,
      msg: "Bad request",
    });
  }

  const validSortByOptions = [
    "author",
    "title",
    "article_id",
    "votes",
    "comment_count",
  ];
  if (sort_by && !validSortByOptions.includes(sort_by)) {
    return Promise.reject({
      status: 400,
      msg: "Bad request",
    });
  }

  const validOrderByOptions = ["ascending", "descending"];
  if (order && !validOrderByOptions.includes(order)) {
    return Promise.reject({
      status: 400,
      msg: "Bad request",
    });
  }

  let queryString = `
  SELECT articles.author, articles.title, articles.article_id, articles.topic, articles.created_at, articles.votes, articles.article_img_url, CAST(COUNT(comments.article_id) AS int) AS comment_count
  FROM articles
  LEFT JOIN comments
  ON comments.article_id = articles.article_id
  `;

  let queryParams = [];
  if (topic) {
    queryString += `
  WHERE articles.topic = $1
  `;
    queryParams.push(topic);
  }

  queryString += `
  GROUP BY articles.article_id
  `;

  let orderArticlesBy = "DESC";

  if (order === "descending") {
    orderArticlesBy = "DESC";
  } else if (order === "ascending") {
    orderArticlesBy = "ASC";
  }

  if (sort_by) {
    queryString += `ORDER BY ${sort_by} ${orderArticlesBy}`;
  } else {
    queryString += `ORDER BY created_at ${orderArticlesBy}`;
  }

  return db.query(queryString, queryParams).then((result) => {
    const articles = result.rows;
    return articles;
  });
};

fetchArticleById = (article_id) => {
  return db
    .query(
      `
  SELECT articles.author, articles.title, articles.article_id, articles.body, articles.topic, articles.created_at, articles.votes, articles.article_img_url
  FROM articles 
  WHERE article_id = $1
  `,
      [article_id]
    )
    .then((result) => {
      if (result.rowCount === 0) {
        return Promise.reject({ status: 404, msg: "Article not found" });
      }
      return result.rows[0];
    });
};

updateArticleVotes = (article_id, inc_votes) => {
  if (!inc_votes) {
    return Promise.reject({
      status: 400,
      msg: "Bad request",
    });
  }

  return db
    .query(
      `
      UPDATE articles
      SET votes = votes + $1
      WHERE article_id = $2
      RETURNING *
    `,
      [inc_votes, article_id]
    )
    .then((result) => {
      if (result.rowCount === 0) {
        return Promise.reject({ status: 404, msg: "Article not found" });
      }
      return result.rows[0];
    });
};

module.exports = { fetchArticles, fetchArticleById, updateArticleVotes };
