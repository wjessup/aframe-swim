export function meshMap(mesh, fn) {
  if (mesh) {
    mesh.traverse(node => {
      if (node.isMesh) {
        fn(node)
      }
    })
  }
}
