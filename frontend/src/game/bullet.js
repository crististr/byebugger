import * as t from 'three';

const createBullet = (controls, position, quaternion, activeBullets, scene, wepPos, wepQuaternion) => {
  const bulletGeo = new t.SphereGeometry(5, 14, 15);
  const bulletMat = new t.MeshToonMaterial({
    color: 0x222222,
    emissiveIntensity: 1
  });

  let bullet = new t.Mesh(bulletGeo, bulletMat);

  bullet.position.copy(wepPos);
  bullet.quaternion.copy(quaternion);

  bullet.active = true;
  setTimeout(() => {
    bullet.active = false;
    scene.remove(bullet);
  }, 800);

  activeBullets.push(bullet);
  scene.add(bullet);
};

export default createBullet;
