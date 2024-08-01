import { Metadata } from 'next';
import { AuthenticatedGeneralPage } from 'apps/chessroulette-web/appPages/AuthenticatedGeneralPage';
import { range } from '@xmatter/util-kit';

// export const metadata: Metadata = {
//   title: 'Chessroulette',
//   description: 'Moves That Matter Lessons That Last',
// };

export default async function Profile() {
  return (
    <AuthenticatedGeneralPage>
      <div className="text-white">Profile</div>
      {/* {range(20).map(() => (
        <p className='pb-4'>
          Ut aliquet vel ipsum eget imperdiet. Ut vel orci at libero consectetur
          elementum sed in massa. Integer gravida, sapien a efficitur elementum,
          ante libero fringilla risus, mollis facilisis massa tortor nec urna.
          Aenean non massa nec magna maximus consectetur. Mauris a tempor eros.
          In tortor augue, porttitor a felis ac, bibendum viverra tellus.
          Integer mauris diam, ultricies vitae nunc faucibus, dignissim feugiat
          arcu. Etiam non dignissim ligula.
        </p>
      ))} */}
    </AuthenticatedGeneralPage>
  );
}
