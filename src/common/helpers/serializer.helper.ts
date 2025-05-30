type NodeSerializer<T> = (node: T) => Record<string, unknown>;
type NodeSerializerResolver<T> = (node: T) => NodeSerializer<T>;

export function serializeTreeAdvanced<T>(
  tree: T[],
  getSerializer: NodeSerializerResolver<T>,
  childrenField = 'children'
): any[] {
  return tree.map((node) => {
    const serializer = getSerializer(node);
    const plain: Record<string, unknown> = serializer(node);

    const children = node[childrenField] as T[] | undefined;

    if (Array.isArray(children)) {
      plain[childrenField] = serializeTreeAdvanced(children, getSerializer, childrenField);
    }

    return plain;
  });
}
