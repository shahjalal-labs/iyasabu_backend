export const paginationHelper = (query: {
  page: number;
  limit: number;
  status?: string;
  searchTerm : string
}) => {
  let { page = 1, limit = 10, status = "", searchTerm = "" } = query;
  page = Number(page);
  limit = Number(limit);

  const skip = (page - 1) * limit;

  return { skip, limit, page, status, searchTerm };
};
